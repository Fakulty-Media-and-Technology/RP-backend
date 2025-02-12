import { Router } from 'express'
import { CustomerPaymentController } from '../../controllers/customers/payment.customer'

export const router = Router()

router.get('/fetch-plans', CustomerPaymentController.fetchPlans)
router.post('/create', CustomerPaymentController.createSubscription)
router.get('/status', CustomerPaymentController.userSubStatus)
