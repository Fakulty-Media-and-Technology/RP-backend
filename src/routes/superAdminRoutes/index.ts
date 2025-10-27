import express from 'express'

import { AdminOnboardingController } from '../../controllers/admins/onboarding.admin'
import { AuthMiddleware } from '../../middlewares/auth'
import { requestValidator } from '../../middlewares/requestValidator'
import { SharedRoutes } from '../SharedRoutes'
import { createAdminORSuperAdminSchema, createClientSchema } from '../../validations/admin'
import { superAdminAdsRouter } from './adsRoute'
import { superAdminClientsRouter } from './clientsRoute'
import { superAdminDashboardRouter } from './dashboardRoute'
import { superAdminEnumsRouter } from './enumsRoute'
import { superAdminFeaturedRouter } from './featuredRoute'
import { superAdminGiftCardRouter } from './giftCardRoutes'
import { superAdminLivesRouter } from './livesRoute'
import { superAdminMediaRouter } from './mediaRoute'
import { superAdminPayoutsRouter } from './payoutRoute'
import { superAdminSubscriptionRouter } from './subscriptionRoute'
import { superAdminSuggestionsRouter } from './suggestionsRoute'
import { superAdminUpcomingRouter } from './upcomingRoute'
import { superAdminUploadsRouter } from './uploadRoute'
import { superAdminUsersRouter } from './userRouter'
import { Multer } from '../../utils/Multer'
import { OnboardingController } from '../../controllers/customers/onboarding.customer'
import { superAdminNotificationRouter } from './notificationRoute'

export const superAdminRouter = express.Router()

superAdminRouter.post('/admins-signin', AdminOnboardingController.adminSignIn)
superAdminRouter.use(AuthMiddleware.authenticateRequest('superadmin-auth'))

new SharedRoutes(superAdminRouter)
  .lives('Admin')
  .fetchSubtitles()
  .profile('superadmin-auth')
  .paymentActions()
  .paymentHistory({ caller: 'Admin' })
  .contents()
  .enums()

superAdminRouter.use('/clients', superAdminClientsRouter)
superAdminRouter.use('/enums', superAdminEnumsRouter)
superAdminRouter.use('/media', superAdminMediaRouter)
superAdminRouter.use('/lives', superAdminLivesRouter)
superAdminRouter.use('/upcoming', superAdminUpcomingRouter)
superAdminRouter.use('/giftcard', superAdminGiftCardRouter)
superAdminRouter.use('/payouts', superAdminPayoutsRouter)
superAdminRouter.use('/suggestions', superAdminSuggestionsRouter)
superAdminRouter.use('/subscription', superAdminSubscriptionRouter)
superAdminRouter.use('/featured', superAdminFeaturedRouter)
superAdminRouter.use('/uploads', superAdminUploadsRouter)
superAdminRouter.use('/user', superAdminUsersRouter)
superAdminRouter.use('/dashboard', superAdminDashboardRouter)
superAdminRouter.use('/ads', superAdminAdsRouter)
superAdminRouter.use('/notifications', superAdminNotificationRouter)

superAdminRouter.post(
  '/create-super-admin',
  requestValidator(createAdminORSuperAdminSchema),
  OnboardingController.createAdminORSuperAdmin('superadmin'),
)

superAdminRouter.post(
  '/create-admin',
  Multer.uploadSingleImage,
  requestValidator(createAdminORSuperAdminSchema),
  OnboardingController.createAdminORSuperAdmin('admin'),
)

superAdminRouter.post(
  '/create-clients',
  Multer.uploadSingleImage,
  requestValidator(createClientSchema),
  OnboardingController.clientsSignup,
)
