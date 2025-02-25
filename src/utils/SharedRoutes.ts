import { Router } from 'express'
import { SharedController } from '../controllers/common/shared.controller'
import { Multer } from '../utils/Multer'
import { requestValidator } from '../middlewares/requestValidator'
import { updateUserProfileSchema } from '../validations/common'
import { AuthHeaderKey } from '../middlewares/auth'

export class SharedRoutes {
  private _baseRouter: Router

  constructor(router: Router) {
    this._baseRouter = router
  }

  livesRoutes(caller: 'Admin' | 'Client') {
    this._baseRouter.post(
      '/lives/create',
      Multer.createLiveConfig,
      SharedController.createLive({ isAdmin: caller === 'Admin' }),
    )

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
