import { Router } from 'express'
import { MediaController } from '../controllers/common/media.controller'
import { Multer } from '../utils/Multer'

export class SharedRoutes {
  private _baseRouter: Router

  constructor(router: Router) {
    this._baseRouter = router
  }

  livesRoutes(caller: 'Admin' | 'Client') {
    this._baseRouter.post(
      '/lives/create',
      Multer.createLiveConfig,
      MediaController.createLive({ isAdmin: caller === 'Admin' }),
    )
  }
}
