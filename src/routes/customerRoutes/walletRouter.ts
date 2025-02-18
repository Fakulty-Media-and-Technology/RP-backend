import { Router } from 'express'
import { CustomerPaymentController } from '../../controllers/customers/payment.customer'

export const router = Router()

router.post('/topup', CustomerPaymentController.topupWallet)
router.get('/fetch', CustomerPaymentController.fetchWallet)
