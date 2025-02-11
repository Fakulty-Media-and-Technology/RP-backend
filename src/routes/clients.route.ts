import express from 'express'

import { ClientProfileController } from '../controllers/clients/profile.clients'
import { CustomerPaymentController } from '../controllers/customers/payment.customer'
import { AuthMiddleware } from '../middlewares/auth'

import { router as ClientsLiveStreamRouter } from './clientsSubRoutes/clientsLivestreamRouter'
import { router as ClientPayoutRouter } from './clientsSubRoutes/clientsPayoutRouter'
import { router as ClientEventRouter } from './clientsSubRoutes/clientEventRouter'
import { router as ClientProfileRouter } from './clientsSubRoutes/clientProfileRouter'
import { SharedRoutes } from '../utils/SharedRoutes'

export const clientsRouter = express.Router()

clientsRouter.use(AuthMiddleware.authenticateRequest('clients-auth'))

clientsRouter.use('/livestream', ClientsLiveStreamRouter)
clientsRouter.use('/payouts', ClientPayoutRouter)
clientsRouter.use('/event', ClientEventRouter)
clientsRouter.use('/profile', ClientProfileRouter)

clientsRouter.get('/history/payment/fetch', ClientProfileController.clientsPaymentHis)
clientsRouter.post('/payment/paystack/init', CustomerPaymentController.startPayment)

new SharedRoutes(clientsRouter).livesRoutes('Client')
