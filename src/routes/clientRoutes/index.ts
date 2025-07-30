import { Router } from 'express'

import { ClientProfileController } from '../../controllers/clients/profile.clients'
import { AuthMiddleware } from '../../middlewares/auth'
import { clientLiveRouter } from './../clientRoutes/clientsLivestreamRouter'
import { clientPayoutRouter } from './../clientRoutes/clientsPayoutRouter'
import { clientEventsRouter } from './../clientRoutes/clientEventRouter'
import { clientprofileRouter } from './../clientRoutes/clientProfileRouter'
import { SharedRoutes } from '../SharedRoutes'
import { clientNotificationRouter } from './notificationRouter'

export const clientsRouter = Router()

clientsRouter.use(AuthMiddleware.authenticateRequest('clients-auth'))

new SharedRoutes(clientsRouter)
  .lives('Client')
  .profile('clients-auth')
  .paymentHistory({ caller: 'Others' })
  .enums()
  .paymentActions()

clientsRouter.use('/livestream', clientLiveRouter)
clientsRouter.use('/payouts', clientPayoutRouter)
clientsRouter.use('/event', clientEventsRouter)
clientsRouter.use('/profile', clientprofileRouter)
clientsRouter.use('/notifications', clientNotificationRouter)
clientsRouter.get('/history/payment/fetch', ClientProfileController.clientsPaymentHis)
