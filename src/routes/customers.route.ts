import { Router } from 'express'

import { CustomerMediaController } from '../controllers/customers/medias.customer'
import { OnboardingController } from '../controllers/customers/onboarding.customer'
import { CustomerPaymentController } from '../controllers/customers/payment.customer'
import { CustomerProfileController } from '../controllers/customers/profile.customer'
import { CustomerPushNotificationController } from '../controllers/customers/pushNotification.customer'
import { CustomerNotificationController } from '../controllers/customers/notifications.customer'

import { AuthMiddleware } from '../middlewares/auth'

import { router as LivesRouter } from './customersSubRoutes/livesRouter'
import { router as MediaRouter } from './customersSubRoutes/mediaRouter'
import { router as RatingsRouter } from './customersSubRoutes/ratingsRouter'
import { router as CommentsRouter } from './customersSubRoutes/commentsRouter'
import { router as SettingsRouter } from './customersSubRoutes/settingRouter'
import { router as UpcomingRouter } from './customersSubRoutes/upcomingRouter'
import { router as PaymentRouter } from './customersSubRoutes/paymentRouter'
import { router as LivestreamRouter } from './customersSubRoutes/livestreamRouter'
import { router as SubscriptionRuuter } from './customersSubRoutes/subscriptionRouter'
import { router as PushNotificationRouter } from './customersSubRoutes/pushNotificationRouter'
import { router as NotificationsRouter } from './customersSubRoutes/notificationsRouter'
import { router as GeneralRouter } from './customersSubRoutes/generalRouter'
import { router as PasswordResetRouter } from './customersSubRoutes/passwordResetRouter'
import { router as WalletRouter } from './customersSubRoutes/walletRouter'
import { router as ProfileRouter } from './customersSubRoutes/profileRouter'

export const customerRouter = Router()

// onboarding
customerRouter.post('/signup', OnboardingController.customerSignup)
customerRouter.post('/general-signin', OnboardingController.signIn)
customerRouter.get('/verification/get-token', OnboardingController.getVerificationToken)
customerRouter.post('/signup/verifyaccount', OnboardingController.verifyAccount)

customerRouter.use('/general', GeneralRouter)
customerRouter.use('/pass-reset', PasswordResetRouter)

//  ****** ptotected Routes
customerRouter.use(AuthMiddleware.authenticateRequest('customer-auth'))

// ***onboarding
customerRouter.post('/signup/createpin', OnboardingController.createPin)

customerRouter.use('/profile', ProfileRouter)
customerRouter.use('/wallet', WalletRouter)
customerRouter.use('/payment', PaymentRouter)
customerRouter.use('/upcoming', UpcomingRouter)
customerRouter.use('/settings', SettingsRouter)
customerRouter.use('/ratings', RatingsRouter)
customerRouter.use('/comments', CommentsRouter)
customerRouter.use('/media', MediaRouter)
customerRouter.use('/live', LivesRouter)
customerRouter.use('/livestream', LivestreamRouter)
customerRouter.use('/subscription', SubscriptionRuuter)
customerRouter.use('/notification', PushNotificationRouter)
customerRouter.use('/notifications', NotificationsRouter)

customerRouter.get('/giftcard/redeem', CustomerPaymentController.redeemGiftCard)
customerRouter.post('/suggestion/create', CustomerProfileController.createSuggestion)
customerRouter.get('/banner/contents', CustomerMediaController.bannerContents)
