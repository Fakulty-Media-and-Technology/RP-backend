import { Router } from 'express'
import { AdminUpcomingController } from '../../controllers/admins/upcoming.admin'
import { Multer } from '../../utils/Multer'

export const superAdminUpcomingRouter = Router()

superAdminUpcomingRouter.post(
  '/event/create',
  Multer.createUpcomingConfig,
  AdminUpcomingController.createUpcomingEvent,
)

superAdminUpcomingRouter.get('/event/getall', AdminUpcomingController.upcomingsAllGet)
