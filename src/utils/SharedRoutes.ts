import { Router } from 'express'
import { PaymentHistoryCaller, SharedController } from '../controllers/common/shared.controller'
import { Multer } from '../utils/Multer'
import { requestValidator } from '../middlewares/requestValidator'
import { updateUserProfileSchema } from '../validations/common'
import { AuthHeaderKey } from '../middlewares/auth'
import { ClientLiveStreamController } from '../controllers/clients/livestream.clients'
import { AdminEnumController } from '../controllers/admins/enums.admin'

export class SharedRoutes {
  private _baseRouter: Router

  constructor(router: Router) {
    this._baseRouter = router
  }

  vods() {
    this._baseRouter.get('/vods/category/:catId', SharedController.fetchVidsForCategory)
  }

  enums() {
    this._baseRouter.get('/get-categories', AdminEnumController.getCategories)
    this._baseRouter.get('/get-genres', AdminEnumController.getGenres)
    this._baseRouter.get('/get-cast', AdminEnumController.getCast)
    this._baseRouter.get('/casts/:castId', AdminEnumController.getCastById)
    return this
  }

  lives(caller: 'Admin' | 'Client') {
    this._baseRouter.post(
      '/lives/create',
      Multer.createLiveConfig,
      SharedController.createLive({ isAdmin: caller === 'Admin' }),
    )

    this._baseRouter.get('/lives/estimate', ClientLiveStreamController.calculateEventCharges)
    this._baseRouter.delete('/lives/delete/:liveId', SharedController.deleteLiveById)
    return this
  }

  paymentHistory(callerConfig: PaymentHistoryCaller) {
    this._baseRouter.get('/trans/payment-history', SharedController.paymentHistory(callerConfig))
    return this
  }

  fetchSubtitles() {
    this._baseRouter.get('/subtitles/fetch/:parentId', SharedController.getSubtitles)
    return this
  }

  updateUserProfile(authType: AuthHeaderKey) {
    this._baseRouter.put(
      '/user-profile/shared/update/:userId',
      Multer.uploadSingleImage,
      requestValidator(updateUserProfileSchema),
      SharedController.updateProfile(authType),
    )

    return this
  }
}

