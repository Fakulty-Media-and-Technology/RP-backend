import { Request } from 'express'
import { OperationalError } from '../../utils/OperationalError'
import { handleDefaultNumAndUnknown } from '../../utils/QueryParamsFeatures'
import { LoggedInUser } from '../../types'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'
import { VideoRepo } from '../../repositories/VideoRepo'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { Video, VideoModel } from '../../models/videos.model'
import { Live, LiveModel } from '../../models/lives.model'
import { FilterQuery, UpdateQuery } from 'mongoose'
import { LiveRepo } from '../../repositories/LiveRepo'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'

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

type ContentType = 'live' | 'vod'

type customerSubscriptionInput = {
  currentUser: LoggedInUser
  contentId: string
  action: CustomerSubScriptionActionType
  contentType: ContentType
}


type AdminFetchInput = {
  contentType: ContentType
  page: unknown
  limit: unknown
}

type CustomerFetchInput = AdminFetchInput & {
  currentUser: LoggedInUser
}

type IsSubscribedInput = {
  currentUser: LoggedInUser
  contentId: string
  contentType: ContentType
}

export class UpcomingService {
  static adminFetch = async ({ contentType, ...params }: AdminFetchInput) => {
    const page = handleDefaultNumAndUnknown(params.page, 1)
    const limit = handleDefaultNumAndUnknown(params.limit, 10)

    return contentType === 'vod'
      ? await MovieMediaSourcesUtils.resolveMediaSources(
          await VideoRepo.fetchUpcoming(page, limit),
          true,
          '720p',
        )
      : await LiveMediaSourcesUtils.resolveSources(
          await LiveRepo.fetchUpcoming(page, limit),
          '720p',
        )
  }

  static customerFetch = async ({ contentType, currentUser, ...params }: CustomerFetchInput) => {
    denyGuestUser(currentUser)

    const page = handleDefaultNumAndUnknown(params.page, 1)
    const limit = handleDefaultNumAndUnknown(params.limit, 10)

    const videoQuality = await VidUploadUtils.getUserVideoQuality(
      currentUser._id.toString(),
      '480p',
    )

    return contentType === 'vod'
      ? await MovieMediaSourcesUtils.resolveMediaSources(
          await VideoRepo.fetchActiveUpcoming(page, limit),
          true,
          videoQuality,
        )
      : await LiveMediaSourcesUtils.resolveSources(
          await LiveRepo.fetchActiveUpcoming(page, limit),
          videoQuality,
        )
  }

  static customerSubscription = async ({
    currentUser,
    action,
    contentId,
    contentType,
  }: customerSubscriptionInput) => {
    denyGuestUser(currentUser)

    const sharedFilter: FilterQuery<Live | Video> = {
      _id: contentId,
      upcoming: true,
    }

    const sharedUpdate: UpdateQuery<Live | Video> = {
      [action === 'subscribe' ? '$addToSet' : '$pull']: {
        upcomingSubscribers: currentUser._id,
      },
      new: true,
    }

    let upcoming: Live | Video | null

    if (contentType === 'live') {
      upcoming = await LiveModel.findOneAndUpdate(sharedFilter, sharedUpdate)
    } else {
      upcoming = await VideoModel.findOneAndUpdate(sharedFilter, sharedUpdate)
    }

    if (upcoming === null) {
      throw new OperationalError('content not found or is not an upcoming content ', 400)
    }
  }

  static customerIsSubscribed = async ({
    currentUser,
    contentType,
    contentId,
  }: IsSubscribedInput) => {
    denyGuestUser(currentUser)

    const cond: FilterQuery<Live | Video> = {
      _id: contentId,
      upcomingSubscribers: currentUser._id,
    }

    return Boolean(
      contentType === 'live' ? await LiveModel.findOne(cond) : await VideoModel.findOne(cond),
    )
  }
}
