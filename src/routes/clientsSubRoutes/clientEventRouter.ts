import { Router } from 'express'
import { ClientLiveStreamController } from '../../controllers/clients/livestream.clients'
import { CustomerPaymentController } from '../../controllers/customers/payment.customer'

export const router = Router()

router.post('/create/payment', CustomerPaymentController.createPayment)
router.get('/payment/estimate', ClientLiveStreamController.calculateEventCharges)
router.post('/live/extend', ClientLiveStreamController.extendLiveEvent)
