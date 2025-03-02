import { Router } from 'express'
import { AdminUpcomingController } from '../../controllers/admins/upcoming.admin'
import { Multer } from '../../utils/Multer'
import { throwDepricatedRoute } from '../../middlewares/depricate'

export const superAdminUpcomingRouter = Router()

superAdminUpcomingRouter.post(
  '/event/create',
  throwDepricatedRoute,
  Multer.createUpcomingConfig,
  AdminUpcomingController.createUpcomingEvent,
)

superAdminUpcomingRouter.get('/event/getall', AdminUpcomingController.upcomingsAllGet)
