import express from 'express'

import { AdminOnboardingController } from '../../controllers/admins/onboarding.admin'
import { AuthMiddleware } from '../../middlewares/auth'
import { requestValidator } from '../../middlewares/requestValidator'
import { SharedRoutes } from '../../utils/SharedRoutes'
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
import { superAdminTrailerRouter } from './trailerRoute'
import { superAdminUpcomingRouter } from './upcomingRoute'
import { superAdminUploadsRouter } from './uploadRoute'
import { superAdminUsersRouter } from './userRouter'
import { throwDepricatedRoute } from '../../middlewares/depricate'

export const superAdminRouter = express.Router()
const sharedRoutes = new SharedRoutes(superAdminRouter)

superAdminRouter.post('/admins-signin', AdminOnboardingController.adminSignIn)

superAdminRouter.use(AuthMiddleware.authenticateRequest('superadmin-auth'))

sharedRoutes.livesRoutes('Admin').fetchSubtitles().updateUserProfile('superadmin-auth')

superAdminRouter.use('/clients', superAdminClientsRouter)
superAdminRouter.use('/enums', superAdminEnumsRouter)
superAdminRouter.use('/media', superAdminMediaRouter)
superAdminRouter.use('/lives', superAdminLivesRouter)
superAdminRouter.use('/upcoming', superAdminUpcomingRouter)
superAdminRouter.use('/trailer', throwDepricatedRoute, superAdminTrailerRouter)
superAdminRouter.use('/giftcard', superAdminGiftCardRouter)
superAdminRouter.use('/payouts', superAdminPayoutsRouter)
superAdminRouter.use('/suggestions', superAdminSuggestionsRouter)
superAdminRouter.use('/subscription', superAdminSubscriptionRouter)
superAdminRouter.use('/featured', superAdminFeaturedRouter)
superAdminRouter.use('/uploads', superAdminUploadsRouter)
superAdminRouter.use('/user', superAdminUsersRouter)
superAdminRouter.use('/dashboard', superAdminDashboardRouter)
superAdminRouter.use('/ads', superAdminAdsRouter)

superAdminRouter.post(
  '/create-super-admin',
  requestValidator(createAdminORSuperAdminSchema),
  AdminOnboardingController.createAdminORSuperAdmin('superadmin'),
)

superAdminRouter.post(
  '/create-admin',
  requestValidator(createAdminORSuperAdminSchema),
  AdminOnboardingController.createAdminORSuperAdmin('admin'),
)

superAdminRouter.post(
  '/create-clients',
  requestValidator(createClientSchema),
  AdminOnboardingController.clientsSignup,
)
