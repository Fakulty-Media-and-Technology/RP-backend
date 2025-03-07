import { Router } from 'express'
import { AdminUpcomingController } from '../../controllers/admins/upcoming.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { upcomingAllGetSchema } from '../../validations/admin'

export const superAdminUpcomingRouter = Router()

superAdminUpcomingRouter.get(
  '/event/getall',
  requestValidator(upcomingAllGetSchema),
  AdminUpcomingController.upcomingsAllGet,
)
