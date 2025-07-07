import { Router } from 'express'
import { AdminFeaturedController } from '../../controllers/admins/featured.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { addFeaturedContentSchema } from '../../validations/admin'

export const superAdminFeaturedRouter = Router()

superAdminFeaturedRouter.get('/contents/fetch', AdminFeaturedController.getFeaturedContents)

superAdminFeaturedRouter.post(
  '/contents/add',
  requestValidator(addFeaturedContentSchema),
  AdminFeaturedController.addFeatured,
)
