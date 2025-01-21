import express from 'express'

import { CustomerVoteController } from '../controllers/customers/vote.custumers'
import { CustomerMediaController } from '../controllers/customers/medias.customer'
import { OnboardingController } from '../controllers/customers/onboarding.customer'
import { CustomerPaymentController } from '../controllers/customers/payment.customer'
import { CustomerProfileController } from '../controllers/customers/profile.customer'
import { CustomerSettingsController } from '../controllers/customers/settings.customer'
import { CustomerUpcomingController } from '../controllers/customers/upcoming.customer'
import { CustomerPushNotificationController } from '../controllers/customers/pushNotification.customer'
import { CustomerNotificationController } from '../controllers/customers/notifications.customer'

import { AuthMiddleware } from '../middlewares/auth'
import { CustomerCommentsRatingsController } from '../controllers/customers/comments.ratings.customer'
import { requestValidator } from '../middlewares/requestValidator'
import {
  createCommentSchema,
  createRatingSchema,
  updateCommentSchema,
  updateRatingSchema,
} from '../validations/customers'

export const customerRouter = express.Router()

// onboarding
customerRouter.post('/signup', OnboardingController.customerSignup)
customerRouter.post('/general-signin', OnboardingController.signIn)
customerRouter.get('/general/validate-token', OnboardingController.authTokenValidity)
customerRouter.get('/general/validate-reftoken', OnboardingController.refTokenValidity)
customerRouter.get('/general/renew-accesstoken', OnboardingController.refreshAccessToken)
customerRouter.get('/verification/get-token', OnboardingController.getVerificationToken)
customerRouter.post('/signup/verifyaccount', OnboardingController.verifyAccount)
customerRouter.post('/pass-reset/get-token', OnboardingController.passwordChangeCode)
customerRouter.post('/pass-reset/change-pass', OnboardingController.passwordChange)

//  ****** ptotected Routes
customerRouter.use(AuthMiddleware.authenticateRequest('customer-auth'))

// ***onboarding
customerRouter.post('/signup/createpin', OnboardingController.createPin)
customerRouter.get('/profile/fetch', CustomerProfileController.customerProfileFetch)
customerRouter.put('/profile/edit', CustomerProfileController.editProfile)

// ***settings
customerRouter.put(
  '/settings/notification-vidquality',
  CustomerSettingsController.notificationSettings,
)
customerRouter.post('/settings/watchlist/add', CustomerSettingsController.addToWatchList)
customerRouter.post('/settings/watchlist/rem', CustomerSettingsController.remFromWatchList)
customerRouter.post('/settings/interest/add', CustomerSettingsController.addToInterest)

// ***Comments
customerRouter.post(
  '/comment/create',
  requestValidator(createCommentSchema),
  CustomerCommentsRatingsController.addComment,
)
customerRouter.get('/comments/fetch/:parentId', CustomerCommentsRatingsController.getComments)

customerRouter
  .route('/comment/:commentId')
  .put(requestValidator(updateCommentSchema), CustomerCommentsRatingsController.updateComment)
  .delete(CustomerCommentsRatingsController.deleteComment)

// *** Ratings
customerRouter.post(
  '/ratings/create',
  requestValidator(createRatingSchema),
  CustomerCommentsRatingsController.addRating,
)

customerRouter.get('/ratings/fetch/:parentId', CustomerCommentsRatingsController.getRatings)

customerRouter
  .route('/rating/:ratingId')
  .put(requestValidator(updateRatingSchema), CustomerCommentsRatingsController.updateRating)
  .delete(CustomerCommentsRatingsController.deleteRating)

// *** Media
customerRouter.post('/media/upload-photo', CustomerMediaController.uploadImageRoute)
customerRouter.post('/media/vod-streaming/:vid', CustomerMediaController.vodStream)
customerRouter.get('/media/vod/fetch/featured', CustomerMediaController.getFeaturedVods)
customerRouter.post('/media/vod/like/:id', CustomerMediaController.likeVideo)
customerRouter.get('/media/vod/userliked/:id', CustomerMediaController.userLikedVideo)
customerRouter.post('/media/vod/unlike/:id', CustomerMediaController.unLikeVideo)

//live events
customerRouter.get('/live/events/fetch/all', CustomerMediaController.getLiveEventsByType('all'))

customerRouter.get(
  '/live/events/fetch/featured',
  CustomerMediaController.getLiveEventsByType('featured'),
)

customerRouter.get(
  '/live/events/fetch/sponsored',
  CustomerMediaController.getLiveEventsByType('sponsored'),
)

customerRouter.get(
  '/live/events/fetch/channels',
  CustomerMediaController.getLiveEventsByType('channels'),
)

customerRouter.get(
  '/live/events/fetch/pop/channels',
  CustomerMediaController.getLiveEventsByType('channels popular'),
)

customerRouter.get(
  '/live/events/fetch/events',
  CustomerMediaController.getLiveEventsByType('events'),
)

customerRouter.get(
  '/live/events/fetch/pop/events',
  CustomerMediaController.getLiveEventsByType('events popular'),
)

customerRouter.get(
  '/live/events/fetch/tvshows',
  CustomerMediaController.getLiveEventsByType('tvshows'),
)

customerRouter.get(
  '/live/events/fetch/pop/tvshows',
  CustomerMediaController.getLiveEventsByType('tvshows popular'),
)

customerRouter.get(
  '/live/events/fetch/sports',
  CustomerMediaController.getLiveEventsByType('sports'),
)

customerRouter.get(
  '/live/events/fetch/pop/sports',
  CustomerMediaController.getLiveEventsByType('sports popular'),
)

customerRouter.get(
  '/live/events/fetch/podcasts',
  CustomerMediaController.getLiveEventsByType('podcasts'),
)

customerRouter.get(
  '/live/events/fetch/pop/podcasts',
  CustomerMediaController.getLiveEventsByType('podcasts popular'),
)

customerRouter.get('/live/event/stream/:id', CustomerMediaController.streamLiveEvent)

// *** Upcoming Events
customerRouter.get('/upcoming/events/fetch', CustomerUpcomingController.fetch)
customerRouter.get('/upcoming/events/is-subscribed/:id', CustomerUpcomingController.isSubscribed)

customerRouter.put(
  '/upcoming/events/subscribe/:id',
  CustomerUpcomingController.subscription('subscribe'),
)

customerRouter.put(
  '/upcoming/events/unsubscribe/:id',
  CustomerUpcomingController.subscription('unsubscribe'),
)

// ***payments and wallets
customerRouter.post('/payment/paystack/start-payment', CustomerPaymentController.startPayment)
customerRouter.post('/payment/paystack/create-payment', CustomerPaymentController.createPayment)
customerRouter.get('/payment/paystack/payment-receipt', CustomerPaymentController.getPaymentReceipt)

customerRouter.get(
  '/payment/paystack/transaction-history',
  CustomerPaymentController.transactionHistory,
)

customerRouter.post(
  '/payment/paystack/authorize-payment',
  CustomerPaymentController.authorizePayment,
)

customerRouter.post('/wallet/topup', CustomerPaymentController.topupWallet)
customerRouter.get('/wallet/fetch', CustomerPaymentController.fetchWallet)
customerRouter.get('/giftcard/redeem', CustomerPaymentController.redeemGiftCard)
customerRouter.get('/subscription/fetch-plans', CustomerPaymentController.fetchPlans)
customerRouter.post('/subscription/create', CustomerPaymentController.createSubscription)
customerRouter.get('/subscription/status', CustomerPaymentController.userSubStatus)

// *** push notification
customerRouter.post(
  '/notification/device/register',
  CustomerPushNotificationController.registerDeviceToken,
)

customerRouter.post(
  '/notification/device/update',
  CustomerPushNotificationController.updateDeviceToken,
)

//suggestion
customerRouter.post('/suggestion/create', CustomerProfileController.createSuggestion)

// **tvshow livestream voting
customerRouter.post('/livestream/vote/create-vote', CustomerVoteController.createVote)
customerRouter.post('/livestream/donate/dash-fund', CustomerVoteController.donateFund)
customerRouter.get('/livestream/vote/fetch-info', CustomerVoteController.fetchVoteInfo)

customerRouter.get(
  '/livestream/vote/fetch-contestants',
  CustomerVoteController.fetchVoteContestants,
)

// ******** notifications
customerRouter.get('/notifications', CustomerNotificationController.getNotifications)
customerRouter.post(
  '/notifications/:notification_id/click',
  CustomerNotificationController.handleNotificationClick,
)

// banner
customerRouter.get('/banner/contents', CustomerMediaController.bannerContents)
