import { Router } from 'express'
import { CustomerPaymentController } from '../../controllers/customers/payment.customer'

export const router = Router()

router.post('/paystack/start-payment', CustomerPaymentController.startPayment)
router.post('/paystack/create-payment', CustomerPaymentController.createPayment)
router.get('/paystack/payment-receipt', CustomerPaymentController.getPaymentReceipt)
router.get('/paystack/transaction-history', CustomerPaymentController.transactionHistory)
router.post('/paystack/authorize-payment', CustomerPaymentController.authorizePayment)
