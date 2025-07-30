import { Router } from 'express'
import { ClientProfileController } from '../../controllers/clients/profile.clients'

export const clientprofileRouter = Router()

clientprofileRouter.route('/fetch').get(ClientProfileController.clientProfileFetch)
