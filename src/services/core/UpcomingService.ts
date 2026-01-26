import { OperationalError } from '../../utils/OperationalError'
import {
  ExpressRequestQuery,
  guranteeNumericResult,
  QueryParamsFeatures,
} from '../../utils/QueryParamsFeatures'
import { LoggedInUser } from '../../types'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { VideoRepo } from '../../repositories/VideoRepo'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { LiveRepo } from '../../repositories/LiveRepo'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import {
  ContentSubscribersModel,
  LIVE_CONTENT_SUB,
  VOD_CONTENT_SUB,
} from '../../models/content.subscribers.model'
import { Notification } from '../../notifications/notification'
import { LiveModel } from '../../models/lives.model'
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

type ContentType = 'live' | 'vod'

type customerSubscriptionInput = {
  currentUser: LoggedInUser
  contentId: string
  action: CustomerSubScriptionActionType
  contentType: ContentType
}

type AdminFetchInput = {
  page: unknown
  limit: unknown
}

type IsSubscribedInput = {
  currentUser: LoggedInUser
  contentId: string
  contentType: ContentType
}

export class UpcomingService {
  static adminFetch = async (params: AdminFetchInput) => {
    const page = guranteeNumericResult(params.page, 1)
    const limit = guranteeNumericResult(params.limit, 10)

    const [vods, lives] = await Promise.all([
      VideoRepo.fetchUpcoming(page, limit),
      LiveMediaSourcesUtils.resolveSources(await LiveRepo.fetchUpcoming(page, limit), '720p'),
    ])

    return {
      vods: MovieMediaSourcesUtils.resolveMediaSources(vods, '720p') || [],
      lives: lives || [],
    }
  }

  static customerFetch = async (currentUser: LoggedInUser, query: ExpressRequestQuery) => {
    denyGuestUser(currentUser)
    const { videoQuality } = currentUser
    const { page, limit } = QueryParamsFeatures.paginagteParams(query)

    const [vods, lives] = await Promise.all([
      VideoRepo.fetchActiveUpcoming(page, limit),

      LiveMediaSourcesUtils.resolveSources(
        await LiveRepo.fetchActiveUpcoming(page, limit),
        videoQuality,
      ),
    ])

    return {
      vods: MovieMediaSourcesUtils.resolveMediaSources(vods, videoQuality) || [],
      lives: lives || [],
    }
  }

  static customerSubscription = async ({
    currentUser,
    action,
    contentId,
    contentType,
  }: customerSubscriptionInput) => {
    denyGuestUser(currentUser)

    const subContentType = contentType === 'live' ? LIVE_CONTENT_SUB : VOD_CONTENT_SUB
    const firebaseTopic = Notification.makeContentTopic(contentId, subContentType)

    if (action === 'unsubscribe') {
      const deletedSubDocument = await ContentSubscribersModel.findOneAndDelete({
        user: currentUser._id,
        content: contentId,
        contentType: subContentType,
      })

      if (deletedSubDocument == null) {
        throw new OperationalError('No subscription found', 404)
      }

      Notification.withUserTokens(currentUser._id, tokens => {
        Notification.unsubscribeFromTopic(firebaseTopic, tokens)
      })
      return
    }

    const content =
      contentType === 'live'
        ? await LiveModel.findById(contentId)
        : await VideoModel.findById(contentId)

    if (content == null) {
      throw new OperationalError('Invalid Content', 404)
    }

    try {
      await ContentSubscribersModel.create({
        user: currentUser._id,
        content: contentId,
        contentType: subContentType,
      })

      Notification.withUserTokens(currentUser._id, tokens => {
        Notification.subscribeToTopic(firebaseTopic, tokens)
      })
    } catch (e: any) {
      if (e.code === 11000) {
        throw new OperationalError('Already Subscribed', 400)
      }
      throw e
    }
  }

  static customerIsSubscribed = async ({
    currentUser,
    contentType,
    contentId,
  }: IsSubscribedInput) => {
    denyGuestUser(currentUser)

    const subDocument = await ContentSubscribersModel.findOne({
      user: currentUser._id,
      content: contentId,
      contentType: contentType === 'live' ? 'LIVE' : 'VOD',
    })

    return !!subDocument
  }
}
