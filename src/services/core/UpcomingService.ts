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
import { VidUploadUtils } from '../../utils/VideoUploadUtils'
import { VideoRepo } from '../../repositories/VideoRepo'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { VideoModel } from '../../models/videos.model'

export type CustomerSubScriptionActionType = 'subscribe' | 'unsubscribe'

export type UpcomingData = {
  title: string
  type: string
  details: string
  releaseDate: string
  trailer?: Express.Multer.File
  trailerLink?: string
  portraitPhoto: Express.Multer.File
  landscapePhoto: Express.Multer.File
  active?: boolean
}

export class UpcomingService extends AdminUploadService {
  private static _createUpcomingWithSession = async (
    data: UpcomingData,
    session: ClientSession,
  ) => {
    if (1) {
      throw new OperationalError('decomissioned route', 400)
    }

    if (data.trailer && data.trailerLink) {
      throw new OperationalError(
        'trailer and trailerLink are optional but only ONE MAY be provided',
        400,
      )
    }

    this._allowMimetype(data.landscapePhoto, 'image', 'landscapePhoto must be an image')
    this._allowMimetype(data.portraitPhoto, 'image', 'portraitPhoto must be an image')

    const upcoming = new UpcomingModel({
      title: data.title,
      type: data.type,
      trailerLink: data.trailerLink,
      details: data.details,
      releaseDate: data.releaseDate,
      active: data.active,
    })

    const photosDocs = await this._uploadAndSavePostersToDB(
      {
        landscapeFile: data.landscapePhoto,
        portraitFile: data.portraitPhoto,
        videoId: upcoming._id,
        posterParentType: 'upcoming',
      },
      session,
    )

    upcoming.landscapePhoto = photosDocs.landscape._id
    upcoming.portraitPhoto = photosDocs.portrait._id

    if (data.trailer) {
      this._allowMimetype(data.trailer, 'video', 'trailer must be a video')

      const trailerDoc = new TrailerModel({
        video_id: upcoming._id,
        parentType: 'upcoming',
      })

      const tVidUploadDoc = await this._getVideoUploadDoc(
        {
          file: data.trailer,
          expire: undefined,
          parentId: trailerDoc._id,
          parentType: 'trailer',
        },
        session,
      )

      trailerDoc.video_upload = tVidUploadDoc._id
      upcoming.peviewTrailer = trailerDoc._id
      await trailerDoc.save({ session })
    }

    await upcoming.save({ session })
    return upcoming
  }

  static adminCreate = async (data: UpcomingData) => {
    return withMongoDBSession(this._createUpcomingWithSession, data)
  }

  static adminFetch = async (query: Request['query']) => {
    const vids = await VideoRepo.fetchUpcoming(
      handleDefaultNumAndUnknown(query.page, 1),
      handleDefaultNumAndUnknown(query.limit, 10),
    )

    return await MovieMediaSourcesUtils.resolveMediaSources(vids, true, '720p')
  }

  static customerFetch = async (query: Request['query'], currentUser: LoggedInUser) => {
    const [vidQuality, vods] = await Promise.all([
      VidUploadUtils.getUserVideoQuality(currentUser._id.toString(), '480p'),

      //
      VideoRepo.fetchActiveUpcoming(
        handleDefaultNumAndUnknown(query.page, 1),
        handleDefaultNumAndUnknown(query.limit, 10),
      ),
    ])

    return await MovieMediaSourcesUtils.resolveMediaSources(vods, true, vidQuality)
  }

  static customerSubscription = async (
    currentUser: LoggedInUser,
    vidId: string,
    action: CustomerSubScriptionActionType,
  ) => {
    denyGuestUser(currentUser)

    const upcoming = await VideoModel.findByIdAndUpdate(vidId, {
      [action === 'subscribe' ? '$addToSet' : '$pull']: {
        upcomingSubscribers: currentUser._id,
      },
    })

    if (upcoming === null) {
      throw new OperationalError('upcoming not found', 404)
    }
  }

  static customerIsSubscribed = async (currentUser: LoggedInUser, vidId: string) => {
    denyGuestUser(currentUser)

    const upcoming = await VideoModel.findOne({
      _id: vidId,
      upcomingSubscribers: currentUser.id,
    })

    return !!upcoming
  }
}
