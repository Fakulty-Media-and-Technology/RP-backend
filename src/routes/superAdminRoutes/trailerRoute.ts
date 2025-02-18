import { Router } from 'express'
import { AdminTrailerController } from '../../controllers/admins/trailer.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { createTrailerSchema, updateTrailerSchema } from '../../validations/admin'

export const superAdminTrailerRouter = Router()

superAdminTrailerRouter.post(
  '/create',
  requestValidator(createTrailerSchema),
  AdminTrailerController.createTrailer,
)

superAdminTrailerRouter.put(
  '/update/:trailerId',
  requestValidator(updateTrailerSchema),
  AdminTrailerController.updateTrailer,
)
