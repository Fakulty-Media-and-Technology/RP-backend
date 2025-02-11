import { Router } from 'express'
import { ClientProfileController } from '../../controllers/clients/profile.clients'
import { requestValidator } from '../../middlewares/requestValidator'
import { updateProfileSchema } from '../../validations/client'

export const router = Router()

router
  .route('/')
  .get(ClientProfileController.clientProfileFetch)
  .post(requestValidator(updateProfileSchema), ClientProfileController.clientEditProfile)

