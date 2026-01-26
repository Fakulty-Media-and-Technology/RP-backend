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
import { ContentSubscribersModel } from '../../models/content.subscribers.model'
import { Notification } from '../../notifications/notification'

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

    const subContentType = contentType === 'live' ? 'LIVE' : 'VOD'
    const firebaseTopic = `${subContentType}_UPCOMING_${contentId}`

    if (action === 'unsubscribe') {
      const deletedSubDocument = await ContentSubscribersModel.findOneAndDelete({
        user: currentUser._id,
        content: contentId,
        contentType: subContentType,
      })

      if (deletedSubDocument == null) {
        throw new OperationalError('No subscription found', 404)
      }

      Notification.withUserTokens(currentUser._id, token => {
        Notification.unsubscribeFromTopic(firebaseTopic, token)
      })
      return
    }

    try {
      await ContentSubscribersModel.create({
        user: currentUser._id,
        content: contentId,
        contentType: subContentType,
      })

      Notification.withUserTokens(currentUser._id, token => {
        Notification.subscribeToTopic(firebaseTopic, token)
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
