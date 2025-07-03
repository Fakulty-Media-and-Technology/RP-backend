import { Router } from 'express'
import { ClientLiveStreamController } from '../../controllers/clients/livestream.clients'
import { CustomerPaymentController } from '../../controllers/customers/payment.customer'

export const router = Router()

router.get('/payment/estimate', ClientLiveStreamController.calculateEventCharges)
