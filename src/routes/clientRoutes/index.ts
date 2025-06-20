import express from 'express'

import { ClientProfileController } from '../../controllers/clients/profile.clients'
import { CustomerPaymentController } from '../../controllers/customers/payment.customer'
import { AuthMiddleware } from '../../middlewares/auth'

import { router as ClientsLiveStreamRouter } from './../clientRoutes/clientsLivestreamRouter'
import { router as ClientPayoutRouter } from './../clientRoutes/clientsPayoutRouter'
import { router as ClientEventRouter } from './../clientRoutes/clientEventRouter'
import { router as ClientProfileRouter } from './../clientRoutes/clientProfileRouter'
import { SharedRoutes } from '../SharedRoutes'

export const clientsRouter = express.Router()
const sharedRoutes = new SharedRoutes(clientsRouter)

clientsRouter.use(AuthMiddleware.authenticateRequest('clients-auth'))

sharedRoutes
  .lives('Client')
  .updateUserProfile('clients-auth')
  .paymentHistory({ caller: 'Others' })
  .enums()
  .paymentActions()

clientsRouter.use('/livestream', ClientsLiveStreamRouter)
clientsRouter.use('/payouts', ClientPayoutRouter)
clientsRouter.use('/event', ClientEventRouter)
clientsRouter.use('/profile', ClientProfileRouter)
clientsRouter.get('/history/payment/fetch', ClientProfileController.clientsPaymentHis)
clientsRouter.post('/payment/paystack/init', CustomerPaymentController.startPayment)
