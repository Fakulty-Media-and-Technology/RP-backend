import { Router } from 'express'
import { AdminAdsController } from '../../controllers/admins/ads.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { createAdSchema } from '../../validations/admin'

export const superAdminAdsRouter = Router()

superAdminAdsRouter.post('/create', requestValidator(createAdSchema), AdminAdsController.addAds)
superAdminAdsRouter.get('/fetchall', AdminAdsController.getAds)
superAdminAdsRouter.delete('/remove/:id', AdminAdsController.removeAds)
