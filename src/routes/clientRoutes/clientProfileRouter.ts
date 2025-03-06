import { Router } from 'express'
import { ClientProfileController } from '../../controllers/clients/profile.clients'

export const router = Router()

router.route('/fetch').get(ClientProfileController.clientProfileFetch)
