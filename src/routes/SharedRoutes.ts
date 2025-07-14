import { Router } from 'express'
import { PaymentHistoryCaller, SharedController } from '../controllers/common/shared.controller'
import { Multer } from '../utils/Multer'
import { requestValidator } from '../middlewares/requestValidator'
import { intitiatePaymentSchema, updateUserProfileSchema } from '../validations/common'
import { AuthHeaderKey } from '../middlewares/auth'
import { ClientLiveStreamController } from '../controllers/clients/livestream.clients'
import { AdminEnumController } from '../controllers/admins/enums.admin'
import { AdminFeaturedController } from '../controllers/admins/featured.admin'

export class SharedRoutes {
  private _router: Router

  constructor(router: Router) {
    this._router = Router()
    router.use('/shared', this._router)
  }

  contents() {
    this._router.get('/vods/category/:catId', SharedController.fetchVidsForCategory)
    this._router.get('/vods/similar-by-cast/:castId', SharedController.getSimilarByCastId)
    this._router.get('/vods/similar-by-genre/:genreId', SharedController.getSimilarByGenreId)

    this._router.get(
      '/vods/categ-and-genre/:genreId/:catId',
      SharedController.getByCategoryIdAndAndGenreId,
    )

    this._router.get('/vods/suggestions', SharedController.randomSuggestions)
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
    this._router.post(
      '/lives/create',
      Multer.createLiveConfig,
      SharedController.createLive({ isAdmin: caller === 'Admin' }),
    )

    this._router.put(
      '/lives/update-media/:liveId',
      Multer.createLiveConfig,
      SharedController.updateLiveMedia,
    )

    this._router.put('/lives/update-active/:liveId', SharedController.updateLiveActiveStatus)
    this._router.get('/lives/estimate', ClientLiveStreamController.calculateEventCharges)
    this._router.delete('/lives/delete/:liveId', SharedController.deleteLiveById)
    return this
  }

  paymentHistory(callerConfig: PaymentHistoryCaller) {
    this._router.get('/payment-history', SharedController.paymentHistory(callerConfig))
    this._router.get('/wallet', SharedController.fetchWallet)
    return this
  }

  paymentActions() {
    this._router.post(
      '/initiate-payment',
      requestValidator(intitiatePaymentSchema),
      SharedController.startPayment,
    )

    this._router.put('/should-store/:paymentId', SharedController.setPaymentShouldStoreDetails)

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
