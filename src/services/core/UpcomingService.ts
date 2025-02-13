import { Request } from 'express'
import { TrailerModel } from '../../models/trailer.model'
import { UpcomingSchema, UpcomingModel } from '../../models/upcoming.model'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures, skip } from '../../utils/QueryParamsFeatures'
import { LoggedInUser } from '../../types'
import { MediaAccess } from '../media-access'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { getPromiseAllFulfilledResults } from '../../utils/promises'
import { ClientSession } from 'mongoose'
import { AdminUploadService } from './AdminUploadService'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { UpcomingRepo } from '../../repositories/UpcomingRepo'
import { UpcomingMediaSourceUtils } from '../../utils/UpcomingMediaSourceUtils'

export type CustomerSubScriptionActionType = 'subscribe' | 'unsubscribe'

export type UpcomingData = {
  title: string
  type: string
  details: string
  releaseDate: string
  trailer: Express.Multer.File
  portraitPhoto: Express.Multer.File
  landscapePhoto: Express.Multer.File
  active?: boolean
}

export class UpcomingService extends AdminUploadService {
  private static _createUpcomingWithSession = async (
    data: UpcomingData,
    session: ClientSession,
  ) => {
    this._allowMimetype(data.trailer, 'video', 'trailer must be a video')
    this._allowMimetype(data.landscapePhoto, 'image', 'landscapePhoto must be an image')
    this._allowMimetype(data.portraitPhoto, 'image', 'portraitPhoto must be an image')

    const upcoming = new UpcomingModel({
      title: data.title,
      type: data.type,
      details: data.details,
      releaseDate: data.releaseDate,
      active: data.active,
    })

    await upcoming.save({ session })

    await this._uploadAndSavePostersToDB(
      {
        landscapeFile: data.landscapePhoto,
        portraitFile: data.portraitPhoto,
        videoId: upcoming._id,
      },
      session,
    )

    const trailerDoc = new TrailerModel({
      video_id: upcoming._id,
      parentType: 'upcoming',
    })

    const tVidUploadDoc = await this._getVideoUploadDoc(
      {
        file: data.trailer,
        waitTranscode: true,
        waitDuration: 30,
        expire: undefined,
        parentId: trailerDoc._id,
        parentType: 'trailer',
      },
      session,
    )

    trailerDoc.video_upload = tVidUploadDoc._id
    await trailerDoc.save({ session })

    return upcoming
  }

  static adminCreate = async (data: UpcomingData) => {
    return withMongoDBSession(this._createUpcomingWithSession, data)
  }

  static adminFetch = async (_: Request['query']) => {
    return await UpcomingMediaSourceUtils.resolveSources(await UpcomingRepo.fetchAggr(), '1080p')
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

    return getPromiseAllFulfilledResults(
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
