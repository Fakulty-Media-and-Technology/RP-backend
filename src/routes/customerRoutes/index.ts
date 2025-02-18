import { Router } from 'express'

import { CustomerMediaController } from '../../controllers/customers/medias.customer'
import { OnboardingController } from '../../controllers/customers/onboarding.customer'
import { CustomerPaymentController } from '../../controllers/customers/payment.customer'
import { CustomerProfileController } from '../../controllers/customers/profile.customer'

import { AuthMiddleware } from '../../middlewares/auth'

import { router as LivesRouter } from './../customerRoutes/livesRouter'
import { router as MediaRouter } from './../customerRoutes/mediaRouter'
import { router as RatingsRouter } from './../customerRoutes/ratingsRouter'
import { router as CommentsRouter } from './../customerRoutes/commentsRouter'
import { router as SettingsRouter } from './../customerRoutes/settingRouter'
import { router as UpcomingRouter } from './../customerRoutes/upcomingRouter'
import { router as PaymentRouter } from './../customerRoutes/paymentRouter'
import { router as LivestreamRouter } from './../customerRoutes/livestreamRouter'
import { router as SubscriptionRuuter } from './../customerRoutes/subscriptionRouter'
import { router as PushNotificationRouter } from './../customerRoutes/pushNotificationRouter'
import { router as NotificationsRouter } from './../customerRoutes/notificationsRouter'
import { router as GeneralRouter } from './../customerRoutes/generalRouter'
import { router as PasswordResetRouter } from './../customerRoutes/passwordResetRouter'
import { router as WalletRouter } from './../customerRoutes/walletRouter'
import { router as ProfileRouter } from './../customerRoutes/profileRouter'
import { SharedRoutes } from '../../utils/SharedRoutes'

export const customerRouter = Router()

// onboarding
customerRouter.post('/signup', OnboardingController.customerSignup)
customerRouter.post('/general-signin', OnboardingController.signIn)
customerRouter.get('/verification/get-token', OnboardingController.getVerificationToken)
customerRouter.post('/signup/verifyaccount', OnboardingController.verifyAccount)
customerRouter.use('/general', GeneralRouter)
customerRouter.use('/pass-reset', PasswordResetRouter)

customerRouter.use(AuthMiddleware.authenticateRequest('customer-auth'))

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

new SharedRoutes(customerRouter).fetchSubtitles()

customerRouter.get('/giftcard/redeem', CustomerPaymentController.redeemGiftCard)
customerRouter.get('/banner/contents', CustomerMediaController.bannerContents)

customerRouter.post('/signup/createpin', OnboardingController.createPin)
customerRouter.post('/suggestion/create', CustomerProfileController.createSuggestion)
