import { Response, Request } from 'express'
import { MediaService } from '../../services/core/MediaService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'
import { validate } from '../../middlewares/requestValidator'
import { addLiveSchema } from '../../validations/admin'
import { UploadMediaUtils } from '../../utils/UploadMediaUtils'
import { AuthHeaderKey } from '../../middlewares/auth'
import { LiveStreamService, CreateLiveData } from '../../services/core/LiveStreamService'
// import { CustomerPaymentService } from '../../services/core/CustomenrPaymentService'
import { VideoService } from '../../services/core/VideoService'
import { PaymentService } from '../../services/core/PaymentService'
import { FilterQuery } from 'mongoose'
import env from '../../env'
import { LiveSchema, LiveModel } from '../../models/lives.model'
import { VideoModel } from '../../models/videos.model'
import { ViewDocument, ViewModel } from '../../models/view.model'
import { LiveRepo } from '../../repositories/LiveRepo'
import { VideoRepo, VodCardResponse } from '../../repositories/VideoRepo'
import { MediaManagement } from '../../services/media-management'
import { LiveAggrRes } from '../../types/Live'
import { Movie } from '../../types/movie'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { signCred } from '../../utils/live'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { QueryParamsFeatures, guranteeNumericResult } from '../../utils/QueryParamsFeatures'
import { VideoQuality, VidUploadUtils } from '../../utils/VideoUploadUtils'
import { getPromiseAllFulfilledResults } from '../../utils/promises'
import { PaymentModel } from '../../models/payments.model'
import { VideoUploadModel } from '../../models/videoupload.model'
import { VideoUploadRepo } from '../../repositories/VideoUploadRepo'
import { MediaAccess } from '../../services/media-access'
import { LikeModel } from '../../models/likes.model'

export type PaymentHistoryCaller = {
  caller: 'Admin' | 'Others'
}

type LiveEventsType =
  | 'all'
  | 'featured'
  | 'sponsored'
  | 'channels'
  | 'channels popular'
  | 'events'
  | 'events popular'
  | 'tvshows popular'
  | 'tvshows'
  | 'sports'
  | 'sports popular'
  | 'podcasts'
  | 'podcasts popular'

export class SharedController extends UploadMediaUtils {
  static checkContentCosts = (_: Request, res: Response) => {
    const costs = PaymentService.checkContentCosts()

    sendResponse({
      res,
      data: costs,
    })
  }

  static checkHasPaidForContent = Catch.async(async (req, res) => {
    const result = await PaymentService.checkHasValidContentPayment({
      contentId: req.params.contentId,
      contentType: req.params.contentType,
      currentUserId: GetDefined.loggedInUser(req.user)._id,
    })

    sendResponse({
      res,
      data: result,
    })
  })

  static startPayment = Catch.async(async (req, res) => {
    const response = await PaymentService.initiatePayment({
      currentUser: GetDefined.loggedInUser(req.user),
      ...req.body,
    })

    sendResponse({
      res,
      message: 'Payment initated successfully',
      data: response,
    })
  })

  static setPaymentShouldStoreDetails = Catch.async(async (req, res) => {
    const response = await PaymentService.setPaymentShouldStoreDetails(
      req.params.paymentId,
      req.query.shouldStore === 'true',
    )

    sendResponse({
      res,
      data: response,
    })
  })

  static authorizePayment = Catch.async(async (req, res) => {
    await PaymentService.authorizePayment({
      currentUser: GetDefined.loggedInUser(req.user),
      amount: req.body.amount,
      paymentDetailsId: req.body.paymentDetailsId,
    })

    sendResponse({
      res,
      data: 'Payment is successful',
    })
  })

  static fetchPaymentDetails = Catch.async(async (req, res) => {
    const response = await PaymentService.fetchPaymentDetails(
      GetDefined.loggedInUser(req.user)._id.toString(),
      req.query,
    )

    sendResponse({
      res,
      data: response,
    })
  })

  static updateProfile = (authType: AuthHeaderKey) =>
    Catch.async(async (req, res) => {
      if (Object.values(req.body).length === 0 && req.file == null) {
        throw new OperationalError('Provide at least one property to update', 400)
      }

      Object.assign(req.body, req.params)

      await MediaService.updateUserProfile({
        imageFile: req.file,
        data: req.body,
        authType,
      })

      sendResponse({
        res,
        message: 'Update successfull',
      })
    })

  static updateLiveMedia = Catch.async(async (req, res) => {
    const files = UploadMediaUtils.checkFiles(req.files)

    await LiveStreamService.editLiveMedia({
      liveId: req.params.liveId,
      coverPhotoFile: files.coverPhoto?.[0],
      previewVideoFile: files.previewVideo?.[0],
    })

    sendResponse({
      res,
      message: 'update initiated.. See dashboard for live after update completion',
    })
  })

  static updateLiveActiveStatus = Catch.async(async (req, res) => {
    await LiveStreamService.updateLiveActiveState({
      liveId: req.params.liveId,
      active: req.body.active,
    })

    sendResponse({
      res,
      message: 'Update successfull',
    })
  })

  static createLive = ({ isAdmin }: { isAdmin: boolean }) =>
    Catch.async(async (req, res) => {
      const { data: _data } = req.body

      if (_data == null || typeof _data !== 'string') {
        throw new OperationalError(
          'formData.data is required and must be a JSON serialized string',
          400,
        )
      }

      const files = UploadMediaUtils.checkFiles(req.files)
      const parsedData = JSON.parse(_data)

      const data: CreateLiveData = {
        ...parsedData,
        previewVideo: files.previewVideo?.[0],
        coverPhoto: files.coverPhoto?.[0],
        clientId: isAdmin ? parsedData.clientId : GetDefined.loggedInUser(req.user).id,
      }

      validate(addLiveSchema, data)

      sendResponse({
        res,
        data: await LiveStreamService.createLive(data),
        message: `Live will be attached to ${isAdmin ? 'client' : 'your'} dashboard after processing`,
      })
    })

  static adminGetPhotoUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const image = await MediaService.getPhotoUrl(bucket, key)
    sendResponse({ res, data: image, message: 'image fetched' })
  })

  static adminGetSubtitleUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const subtitle = await MediaService.getSubtitleUrl(bucket, key)
    sendResponse({ res, data: subtitle, message: 'subtitle fetched' })
  })

  static getVidoeUploadStream = Catch.async(async (req, res) => {
    const _vodStream = await MediaService.getVodStream(
      req.params.vidUploadId,
      GetDefined.loggedInUser(req.user),
    )
    sendResponse({ res, data: _vodStream, message: 'stream fetched' })
  })

  static getSubtitles = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await MediaService.getSubtitles(req.params.parentId),
    })
  })

  static deleteLiveById = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await LiveStreamService.deleteLive({
        liveId: req.params.liveId,
        currentUser: GetDefined.loggedInUser(req.user),
      }),
    })
  })

  static paymentHistory = ({ caller }: PaymentHistoryCaller) =>
    Catch.async(async (req, res) => {
      const getQueryUserId = () => {
        const { userId } = req.query

        if (typeof userId !== 'string') {
          throw new OperationalError('query.userId is required', 400)
        }

        return userId
      }

      const userId =
        caller === 'Admin' ? getQueryUserId() : GetDefined.loggedInUser(req.user)._id.toString()

      sendResponse({
        res,
        data: await PaymentService.getHistory(userId, req.query),
      })
    })

  static fetchVidsForCategory = Catch.async(async ({ query, user, params }, res) => {
    const videos = await VideoService.getVodsForCategory({
      categoryId: params.catId,
      currentUser: GetDefined.loggedInUser(user),
      query,
    })

    sendResponse({
      res,
      message: 'videos fetched succesfully',
      data: videos,
    })
  })

  static fetchWallet = Catch.async(async (req, res) => {
    const wallet = await PaymentService.fetchWallet(GetDefined.loggedInUser(req.user))

    sendResponse({
      res,
      data: wallet,
      message: 'user wallet info',
    })
  })

  static fetchVideoSource = Catch.async(async (req, res) => {
    const loggedInUserId = GetDefined.loggedInUser(req.user)._id.toString()

    const [videoDocumentResult, videoQualityResult] = await Promise.allSettled([
      VideoModel.findById(req.params.videoId),
      VidUploadUtils.getUserVideoQuality(loggedInUserId),
    ])

    if (videoDocumentResult.status === 'rejected') {
      throw videoDocumentResult.reason
    }

    const quality: VideoQuality =
      videoQualityResult.status === 'rejected' ? '480p' : videoQualityResult.value

    const videoDocument = videoDocumentResult.value
    let source: string | null = null

    if (videoDocument == null) {
      throw new OperationalError('Not Found', 404)
    }

    switch (req.params.type) {
      case 'vod':
        if (videoDocument.videoLink) {
          source = videoDocument.videoLink
          break
        }

        const vodUploadDocument = await VideoUploadRepo.findByParentId(videoDocument._id).where(
          'parentType',
          'vod',
        )

        if (vodUploadDocument == null || vodUploadDocument.isTranscoded === false) {
          throw new OperationalError('Not Found', 404)
        }

        source = VidUploadUtils.getResSourceUrl(vodUploadDocument, quality)
        break

      case 'trailer':
        if (videoDocument.trailerLink) {
          source = videoDocument.trailerLink
        }

        const videoUploadDocument = await VideoUploadRepo.findByParentId(videoDocument._id).where(
          'parentType',
          'trailer',
        )

        if (videoUploadDocument == null || videoUploadDocument.isTranscoded === false) {
          throw new OperationalError('Not Found', 404)
        }

        source = VidUploadUtils.getResSourceUrl(videoUploadDocument, quality)
        break

      default:
        throw new OperationalError('Expected type to be vod or trailer', 404)
    }

    if (source == null) {
      throw new OperationalError('Not Found', 422)
    }

    sendResponse({
      res,
      data: { source },
    })
  })

  static getFeaturedVods = Catch.async(async ({ query, user }, res) => {
    const vidQuality = await VidUploadUtils.getUserVideoQuality(
      GetDefined.loggedInUser(user)._id.toString(),
    )

    const { page, limit } = QueryParamsFeatures.paginagteParams(query)

    const vods = await VideoRepo.fetchFeatured(page, limit)

    sendResponse({
      res,
      data: MovieMediaSourcesUtils.resolveMediaSources(vods, vidQuality),
      message: 'featured contents fetched successful',
    })
  })

  static getSimilarByCastId = Catch.async(async ({ query, user, params }, res) => {
    const vidQuality = await VidUploadUtils.getUserVideoQuality(
      GetDefined.loggedInUser(user)._id.toString(),
    )

    const { page, limit } = QueryParamsFeatures.paginagteParams(query)

    const vods = await VideoRepo.fetchSimilarByCastId({
      page,
      limit,
      castId: params.castId,
      vodToExcludeId: query.vodId,
    })

    sendResponse({
      res,
      data: MovieMediaSourcesUtils.resolveMediaSources(vods, vidQuality),
      message: '',
    })
  })

  static getSimilarByGenreId = Catch.async(async ({ query, user, params }, res) => {
    const vidQuality = await VidUploadUtils.getUserVideoQuality(
      GetDefined.loggedInUser(user)._id.toString(),
    )

    const { page, limit } = QueryParamsFeatures.paginagteParams(query)

    const vods = await VideoRepo.fetchSimilarByGenreId({
      page,
      limit,
      genreId: params.genreId,
      vodToExcludeId: query.vodId,
    })

    sendResponse({
      res,
      data: MovieMediaSourcesUtils.resolveMediaSources(vods, vidQuality),
      message: '',
    })
  })

  static getByCategoryIdAndAndGenreId = Catch.async(async ({ query, user, params }, res) => {
    const { page, limit } = QueryParamsFeatures.paginagteParams(query)

    const vidQuality = await VidUploadUtils.getUserVideoQuality(
      GetDefined.loggedInUser(user)._id.toString(),
    )

    const vods = await VideoRepo.fetchByCategAndCast({
      page,
      limit,
      genreId: params.genreId,
      catId: params.catId,
    })

    sendResponse({
      res,
      data: MovieMediaSourcesUtils.resolveMediaSources(vods, vidQuality),
      message: '',
    })
  })

  static randomSuggestions = Catch.async(async ({ query, user }, res) => {
    const userId = GetDefined.loggedInUser(user)._id.toString()
    const { limit } = QueryParamsFeatures.paginagteParams(query)

    const [vidQualityResult, vodsRepoReult, liveRepoResult] = await Promise.allSettled([
      VidUploadUtils.getUserVideoQuality(userId),
      VideoRepo.fetchRandom(limit),
      LiveRepo.fetchRandom(limit),
    ])

    if (vidQualityResult.status == 'rejected') {
      throw vidQualityResult.reason
    }

    if (vodsRepoReult.status == 'rejected') {
      throw vodsRepoReult.reason
    }

    if (liveRepoResult.status == 'rejected') {
      throw liveRepoResult.reason
    }

    const vidQuality = vidQualityResult.value

    const response = {
      vods: MovieMediaSourcesUtils.resolveMediaSources(vodsRepoReult.value, vidQuality),
      lives: await LiveMediaSourcesUtils.resolveSources(liveRepoResult.value, vidQuality),
    }

    sendResponse({
      res,
      data: response,
      message: '',
    })
  })

  static getFeaturedLives = Catch.async(async ({ query, user }, res) => {
    const vidQuality = await VidUploadUtils.getUserVideoQuality(
      GetDefined.loggedInUser(user)._id.toString(),
    )

    sendResponse({
      res,
      message: 'featured contents fetched successful',
      data: await LiveMediaSourcesUtils.resolveSources(
        await LiveRepo.getFeatured(
          guranteeNumericResult(query.page, 1),
          guranteeNumericResult(query.limit, 10),
        ),
        vidQuality,
      ),
    })
  })

  // ***************** likes ************************ //

  static likeVideo = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const videoDocument = await VideoModel.findById(req.params.id)

    if (videoDocument == null) {
      throw new OperationalError('Video Not found', 404)
    }

    await LikeModel.create({
      user: user._id,
      content: videoDocument._id,
      contentType: 'vod',
    })

    ++videoDocument.likesCount
    videoDocument.computeEngagements()

    sendResponse({
      res,
      message: 'video liked',
    })
  })

  protected static _computeViewParentEngagements = async (viewDocument: ViewDocument) => {
    try {
      switch (viewDocument.contentType) {
        case 'vod':
          const videoDocument = await VideoModel.findById(viewDocument.content)

          if (videoDocument == null) return

          ++videoDocument.viewsCount
          videoDocument.computeEngagements()

          break

        default:
          break
      }
    } catch (e) {
      console.error('Error in _computeParentEngagements', e)
    }
  }

  static viewContent = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const viewDocument = await ViewModel.create({
      viewer: user._id,
      content: req.body.content,
      contentType: req.body.contentType,
    })

    this._computeViewParentEngagements(viewDocument)

    sendResponse({
      res,
      message: 'done',
    })
  })

  static userLikedVideo = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const likeDocument = await LikeModel.findOne({
      user: user._id,
      content: req.params.id,
      contentType: 'vod',
    })

    sendResponse({
      res,
      message: '',
      data: {
        user_liked: !!likeDocument,
      },
    })
  })

  static unLikeVideo = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const deletedLikeDocument = await LikeModel.findOneAndDelete({
      user: user._id,
      content: req.params.id,
    })

    if (deletedLikeDocument == null) {
      throw new OperationalError('Like Not Found', 404)
    }

    const videoDocument = await VideoModel.findById(deletedLikeDocument.content)

    if (videoDocument == null) {
      throw new OperationalError('Content Not Found', 404)
    }

    --videoDocument.likesCount
    videoDocument.computeEngagements()

    sendResponse({
      res,
      message: 'video unliked',
    })
  })

  // ************ GET EVENTS *********************//

  static getLiveEventsByType = (type: LiveEventsType) =>
    Catch.async(async (req, res) => {
      let filter: FilterQuery<LiveSchema> = { expired: false }

      switch (type) {
        case 'featured':
          filter.featured = true
          break
        case 'sponsored':
          filter.sponsored = true
          break
        case 'channels':
          filter.type = 'channel'
          break
        case 'channels popular':
          filter.type = 'channel'
          filter.popular = true
          break
        case 'events':
          filter.type = 'event'
          break
        case 'events popular':
          filter.type = 'event'
          filter.popular = true
          break
        case 'tvshows':
          filter.type = 'tvshow'
          break
        case 'tvshows popular':
          filter.type = 'tvshow'
          filter.popular = true
          break
        case 'sports popular':
          filter.type = 'sport'
          filter.popular = true
          break
        case 'sports':
          filter.type = 'sport'
          break
        case 'podcasts':
          filter.type = 'podcast'
          break
        case 'podcasts popular':
          filter.type = 'podcast'
          filter.popular = true
          break

        default:
          filter = filter
          break
      }

      const vidQuality = await VidUploadUtils.getUserVideoQuality(
        GetDefined.loggedInUser(req.user)._id.toString(),
      )

      const { page, limit } = QueryParamsFeatures.paginagteParams(req.query)

      const liveEvents = await LiveMediaSourcesUtils.resolveSources(
        await LiveRepo.getSelectedLive(filter, page, limit),
        vidQuality,
      )

      sendResponse({
        res,
        data: liveEvents,
        message: 'Events fetched',
      })
    })

  static bannerContents = Catch.async(async (req, res) => {
    const page = guranteeNumericResult(req.query.page, 1)
    const limit = guranteeNumericResult(req.query.limit, 1)

    const vidQuality = await VidUploadUtils.getUserVideoQuality(
      GetDefined.loggedInUser(req.user)._id.toString(),
    )

    let lives: LiveAggrRes[] = await LiveMediaSourcesUtils.resolveSources(
      await LiveRepo.getFeatured(page, limit),
      vidQuality,
    )

    let vods: VodCardResponse[] = MovieMediaSourcesUtils.resolveMediaSources(
      await VideoRepo.fetchFeatured(page, limit),
      vidQuality,
    )

    //

    if (lives.length + vods.length < 10) {
      lives = await LiveMediaSourcesUtils.resolveSources(
        await LiveRepo.getMostEngaged(page, limit),
        vidQuality,
      )

      vods = MovieMediaSourcesUtils.resolveMediaSources(
        await VideoRepo.fetchMostEngaged(page, limit),
        vidQuality,
      )
    }

    // TODO: This is hackey. Optimize and Polish
    lives = getPromiseAllFulfilledResults(
      await Promise.allSettled(
        lives.map(async live => {
          const response = Object.assign(live, {
            canView: (
              await PaymentService.checkHasValidContentPayment({
                currentUserId: GetDefined.loggedInUser(req.user)._id,
                contentId: live._id,
                contentType: 'live',
              })
            ).canView,
          })

          return response
        }),
      ),
    )

    sendResponse({
      res,
      message: 'contents fetched',
      data: {
        lives,
        vods,
      },
    })
  })

  static streamLiveEvent = Catch.async(async (req, res) => {
    const streamId = req.params.id
    const event = await LiveModel.findById(streamId)

    if (event == null) {
      throw new OperationalError('invalid stream ID', 404)
    }

    if (event.expired) {
      throw new OperationalError('stream event has expired', 400)
    }

    const signed = `?sign=${signCred(event.stream_key, event.expiry)}`
    const stream_url = `${env.RP_HLS_URL}${event.stream_key}/index.m3u8` + signed

    const data = {
      live_data: event,
      url: stream_url,
    }

    sendResponse({
      res,
      data,
      message: 'live event fetched',
    })
  })
}
