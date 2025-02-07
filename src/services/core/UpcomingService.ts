import { Request } from 'express'
import { TrailerModel } from '../../models/trailer.model'
import { UpcomingSchema, UpcomingModel } from '../../models/upcoming.model'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures, skip } from '../../utils/QueryParamsFeatures'
import { LoggedInUser } from '../../types'
import { MediaAccess } from '../media-access'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { getFulfilledValues } from '../../utils/promise'

export type CustomerSubScriptionActionType = 'subscribe' | 'unsubscribe'

export class UpcomingService {
  static adminCreate = async (data: UpcomingSchema) => {
    const { title, type, details, release_date, portrait_photo, landscape_photo, trailer_id } = data

    const checkTrailer = await TrailerModel.findOne({ _id: trailer_id })

    if (checkTrailer == null) {
      throw new OperationalError('invalid trailer_id supplied', 400)
    }

    const upcomingEvent = await UpcomingModel.create({
      title: title,
      type: type,
      details: details,
      release_date: new Date(release_date),
      portrait_photo: portrait_photo,
      landscape_photo: landscape_photo,
      trailer_id: trailer_id,
    })

    return upcomingEvent
  }

  static adminFetch = async (query: Request['query']) => {
    const features = new QueryParamsFeatures(
      UpcomingModel.find({}).sort({ updatedAt: -1 }).select('-__v -createdAt -updatedAt'),
      {
        defaultLimit: 10,
        defaultPage: 1,
        queryParams: query,
      },
    )

    const upcomingEvents = await features.paginate().query
    return upcomingEvents
  }

  //   ********************** customers
  private static _signS3Keys = async (event: any) => {
    if (event.portrait_photo?.Bucket && event.portrait_photo?.Key) {
      event.portrait_photo = await MediaAccess.getSignedUrl(
        event.portrait_photo.Bucket,
        event.portrait_photo.Key,
        'photo',
      )
    }

    if (event.landscape_photo?.Bucket && event.landscape_photo?.Key) {
      event.landscape_photo = await MediaAccess.getSignedUrl(
        event.landscape_photo.Bucket,
        event.landscape_photo.Key,
        'photo',
      )
    }

    // if (event.trailer && event.trailer.video_upload) {
    //   await VideoUploadParser.signResolutionsOrRaw(event.trailer.video_upload)
    // }

    return event
  }

  static customerFetch = async (page: number, limit: number) => {
    const upcomingEvents = await UpcomingModel.aggregate([
      {
        $match: {
          active: true,
        },
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip(page, limit) },
      { $limit: limit },
      {
        $lookup: {
          from: 'trailers',
          localField: 'trailer_id',
          foreignField: '_id',
          as: 'trailer',
          pipeline: [
            {
              $project: {
                __v: 0,
              },
            },

            {
              $lookup: {
                from: 'video_uploads',
                localField: 'video_upload',
                foreignField: '_id',
                as: 'video_upload',

                pipeline: [
                  {
                    $project: {
                      bucket: true,
                      key: true,
                      resolutions: true,
                      isTranscoded: true,
                    },
                  },
                ],
              },
            },

            { $addFields: { video_upload: { $first: '$video_upload' } } },
          ],
        },
      },
      {
        $addFields: {
          trailer: { $first: '$trailer' },
        },
      },
    ])

    return getFulfilledValues(
      await Promise.allSettled(
        upcomingEvents.map(upcomingEvent => this._signS3Keys(upcomingEvent)),
      ),
    )
  }

  static customerSubscription = async (
    currentUser: LoggedInUser,
    upcomingId: string,
    action: CustomerSubScriptionActionType,
  ) => {
    denyGuestUser(currentUser)

    const upcoming = await UpcomingModel.findByIdAndUpdate(upcomingId, {
      [action === 'subscribe' ? '$addToSet' : '$pull']: {
        reminder: currentUser._id,
      },
    })

    if (upcoming === null) {
      throw new OperationalError('Upcoming not found', 404)
    }
  }

  static customerIsSubscribed = async (currentUser: LoggedInUser, upcomingId: string) => {
    denyGuestUser(currentUser)

    const upcoming = await UpcomingModel.findOne({
      _id: upcomingId,
      reminder: currentUser.id,
    })

    return !!upcoming
  }
}
