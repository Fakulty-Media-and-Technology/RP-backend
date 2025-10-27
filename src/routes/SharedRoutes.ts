import { Router } from 'express'
import { PaymentHistoryCaller, SharedController } from '../controllers/common/shared.controller'
import { Multer } from '../utils/Multer'
import { requestValidator } from '../middlewares/requestValidator'

import {
  authorizePaymentSchema,
  intitiatePaymentSchema,
  updateUserProfileSchema,
} from '../validations/common'

import { AuthHeaderKey } from '../middlewares/auth'
import { ClientLiveStreamController } from '../controllers/clients/livestream.clients'
import { AdminEnumController } from '../controllers/admins/enums.admin'
import { AdminFeaturedController } from '../controllers/admins/featured.admin'
import { AdminUploadController } from '../controllers/admins/uploads.admin'

export class SharedRoutes {
  private _router: Router

  constructor(parentRouter: Router) {
    this._router = Router()
    parentRouter.use('/shared', this._router)
  }

  protected vods() {
    const vodsRouter = Router()

    vodsRouter.get('/suggestions', SharedController.randomSuggestions)
    vodsRouter.get('/category/:catId', SharedController.fetchVidsForCategory)
    vodsRouter.get('/similar-by-cast/:castId', SharedController.getSimilarByCastId)
    vodsRouter.get('/seasons/:vidId', AdminUploadController.fetchSeasonsAndEpisodes)
    vodsRouter.get('/similar-by-genre/:genreId', SharedController.getSimilarByGenreId)
    vodsRouter.get('/video-source/:videoId/:type', SharedController.fetchVideoSource)

    vodsRouter.get(
      '/categ-and-genre/:genreId/:catId',
      SharedController.getByCategoryIdAndAndGenreId,
    )

    this._router.use('/vods', vodsRouter)
  }

  contents() {
    this.vods()
    this._router.get('/featured/contents/search/:text', AdminFeaturedController.searchContents)
    return this
  }

  enums() {
    this._router.get('/get-categories', AdminEnumController.getCategories)
    this._router.get('/get-genres', AdminEnumController.getGenres)
    this._router.get('/get-casts', AdminEnumController.getCasts)
    this._router.get('/casts/:castId', AdminEnumController.getCastById)
    return this
  }

  lives(caller: 'Admin' | 'Client') {
    const livesRouter = Router()

    livesRouter.post(
      '/create',
      Multer.createLiveConfig,
      SharedController.createLive({ isAdmin: caller === 'Admin' }),
    )

    livesRouter.put(
      '/update-media/:liveId',
      Multer.createLiveConfig,
      SharedController.updateLiveMedia,
    )

    livesRouter.put('/update-active/:liveId', SharedController.updateLiveActiveStatus)
    livesRouter.get('/estimate', ClientLiveStreamController.calculateEventCharges)
    livesRouter.delete('/delete/:liveId', SharedController.deleteLiveById)
    this._router.use('', livesRouter)
    return this
  }

  paymentHistory(callerConfig: PaymentHistoryCaller) {
    this._router.get('/payment-history', SharedController.paymentHistory(callerConfig))
    this._router.get('/wallet', SharedController.fetchWallet)
    this._router.put('/should-store/:paymentId', SharedController.setPaymentShouldStoreDetails)
    this._router.get('/payment-details', SharedController.fetchPaymentDetails)
    this._router.get('/content-costs', SharedController.checkContentCosts)

    this._router.get(
      '/check-content-payment/:contentType/:contentId',
      SharedController.checkHasPaidForContent,
    )

    return this
  }

  paymentActions() {
    this._router.post(
      '/initiate-payment',
      requestValidator(intitiatePaymentSchema),
      SharedController.startPayment,
    )

    this._router.post(
      '/authorize-payment',
      requestValidator(authorizePaymentSchema),
      SharedController.authorizePayment,
    )
    return this
  }

  fetchSubtitles() {
    this._router.get('/subtitles/fetch/:parentId', SharedController.getSubtitles)
    return this
  }

  profile(authType: AuthHeaderKey) {
    this._router.put(
      '/user-profile/update/:userId',
      Multer.uploadSingleImage,
      requestValidator(updateUserProfileSchema),
      SharedController.updateProfile(authType),
    )

    return this
  }
}
