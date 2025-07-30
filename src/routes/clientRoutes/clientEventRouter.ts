import { Router } from 'express'
import { ClientLiveStreamController } from '../../controllers/clients/livestream.clients'

export const clientEventsRouter = Router()

clientEventsRouter.get('/payment/estimate', ClientLiveStreamController.calculateEventCharges)
