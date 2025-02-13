import { Request } from 'express'
import { TrailerModel } from '../../models/trailer.model'
import { UpcomingModel } from '../../models/upcoming.model'
import { OperationalError } from '../../utils/OperationalError'
import { handleDefaultNumAndUnknown } from '../../utils/QueryParamsFeatures'
import { LoggedInUser } from '../../types'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { ClientSession } from 'mongoose'
import { AdminUploadService } from './AdminUploadService'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { UpcomingRepo } from '../../repositories/UpcomingRepo'
import { UpcomingMediaSourceUtils } from '../../utils/UpcomingMediaSourceUtils'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'

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
        posterParentType: 'upcoming',
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

  static adminFetch = async (query: Request['query']) => {
    const upAggrRes = await UpcomingRepo.fetchAggr({
      prevStages: [],
      page: handleDefaultNumAndUnknown(query.page, 1),
      limit: handleDefaultNumAndUnknown(query.limit, 10),
    })

    return await UpcomingMediaSourceUtils.resolveSources(upAggrRes, '1080p')
  }

  static customerFetch = async (query: Request['query'], currentUser: LoggedInUser) => {
    const [vidQuality, upAggrRes] = await Promise.all([
      VidUploadUtils.getUserVideoQuality(currentUser._id.toString(), '480p'),

      //
      await UpcomingRepo.fetchAggr({
        prevStages: [{ $match: { active: true } }],
        page: handleDefaultNumAndUnknown(query.page, 1),
        limit: handleDefaultNumAndUnknown(query.limit, 10),
      }),
    ])

    return await UpcomingMediaSourceUtils.resolveSources(upAggrRes, vidQuality)
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
