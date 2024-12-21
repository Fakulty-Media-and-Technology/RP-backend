"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerRouter = void 0;
const express_1 = __importDefault(require("express"));
const vote_custumers_1 = require("../controllers/customers/vote.custumers");
const medias_customer_1 = require("../controllers/customers/medias.customer");
const onboarding_customer_1 = require("../controllers/customers/onboarding.customer");
const payment_customer_1 = require("../controllers/customers/payment.customer");
const profile_customer_1 = require("../controllers/customers/profile.customer");
const settings_customer_1 = require("../controllers/customers/settings.customer");
const upcoming_customer_1 = require("../controllers/customers/upcoming.customer");
const pushNotification_customer_1 = require("../controllers/customers/pushNotification.customer");
const notifications_customer_1 = require("../controllers/customers/notifications.customer");
const auth_1 = require("../middlewares/auth");
exports.customerRouter = express_1.default.Router();
// onboarding
exports.customerRouter.post('/signup', onboarding_customer_1.OnboardingController.customerSignup);
exports.customerRouter.post('/general-signin', onboarding_customer_1.OnboardingController.signIn);
exports.customerRouter.get('/general/validate-token', onboarding_customer_1.OnboardingController.authTokenValidity);
exports.customerRouter.get('/general/validate-reftoken', onboarding_customer_1.OnboardingController.refTokenValidity);
exports.customerRouter.get('/general/renew-accesstoken', onboarding_customer_1.OnboardingController.refreshAccessToken);
exports.customerRouter.get('/verification/get-token', onboarding_customer_1.OnboardingController.getVerificationToken);
exports.customerRouter.post('/signup/verifyaccount', onboarding_customer_1.OnboardingController.verifyAccount);
exports.customerRouter.post('/pass-reset/get-token', onboarding_customer_1.OnboardingController.passwordChangeCode);
exports.customerRouter.post('/pass-reset/change-pass', onboarding_customer_1.OnboardingController.passwordChange);
//  ****** ptotected Routes
exports.customerRouter.use(auth_1.AuthMiddleware.authenticateRequest('customer-auth'));
// ***onboarding
exports.customerRouter.post('/signup/createpin', onboarding_customer_1.OnboardingController.createPin);
exports.customerRouter.get('/profile/fetch', profile_customer_1.CustomerProfileController.customerProfileFetch);
exports.customerRouter.put('/profile/edit', profile_customer_1.CustomerProfileController.editProfile);
// ***settings
exports.customerRouter.put('/settings/notification-vidquality', settings_customer_1.CustomerSettingsController.notificationSettings);
exports.customerRouter.post('/settings/watchlist/add', settings_customer_1.CustomerSettingsController.addToWatchList);
exports.customerRouter.post('/settings/watchlist/rem', settings_customer_1.CustomerSettingsController.remFromWatchList);
exports.customerRouter.post('/settings/interest/add', settings_customer_1.CustomerSettingsController.addToInterest);
// *** Media
exports.customerRouter.post('/media/upload-photo', medias_customer_1.CustomerMediaController.uploadImageRoute);
exports.customerRouter.post('/media/vod-streaming', medias_customer_1.CustomerMediaController.vodStream);
exports.customerRouter.get('/media/vod/fetch/featured', medias_customer_1.CustomerMediaController.getFeaturedVods);
exports.customerRouter.post('/media/vod/like/:id', medias_customer_1.CustomerMediaController.likeVideo);
exports.customerRouter.get('/media/vod/userliked/:id', medias_customer_1.CustomerMediaController.userLikedVideo);
exports.customerRouter.post('/media/vod/unlike/:id', medias_customer_1.CustomerMediaController.unLikeVideo);
//live events
exports.customerRouter.get('/live/events/fetch/all', medias_customer_1.CustomerMediaController.getLiveEvents);
exports.customerRouter.get('/live/events/fetch/featured', medias_customer_1.CustomerMediaController.getLiveEventsFeatured);
exports.customerRouter.get('/live/events/fetch/sponsored', medias_customer_1.CustomerMediaController.getLiveEventsSponsored);
exports.customerRouter.get('/live/events/fetch/channels', medias_customer_1.CustomerMediaController.getLiveEventsChannels);
exports.customerRouter.get('/live/events/fetch/pop/channels', medias_customer_1.CustomerMediaController.getLiveEventsChannelsPop);
exports.customerRouter.get('/live/events/fetch/events', medias_customer_1.CustomerMediaController.getLiveEventsEven);
exports.customerRouter.get('/live/events/fetch/pop/events', medias_customer_1.CustomerMediaController.getLiveEventsEvenPop);
exports.customerRouter.get('/live/events/fetch/tvshows', medias_customer_1.CustomerMediaController.getLiveEventsTvshow);
exports.customerRouter.get('/live/events/fetch/pop/tvshows', medias_customer_1.CustomerMediaController.getLiveEventsTvshowPop);
exports.customerRouter.get('/live/events/fetch/sports', medias_customer_1.CustomerMediaController.getLiveEventsSports);
exports.customerRouter.get('/live/events/fetch/pop/sports', medias_customer_1.CustomerMediaController.getLiveEventsSportsPop);
exports.customerRouter.get('/live/events/fetch/podcasts', medias_customer_1.CustomerMediaController.getLiveEventsPodcast);
exports.customerRouter.get('/live/events/fetch/pop/podcasts', medias_customer_1.CustomerMediaController.getLiveEventsPodcastPop);
exports.customerRouter.get('/live/event/stream/:id', medias_customer_1.CustomerMediaController.streamLiveEvent);
// *** Upcoming Events
exports.customerRouter.get('/upcoming/events/fetch', upcoming_customer_1.CustomerUpcomingController.upComingFetch);
exports.customerRouter.put('/upcoming/events/subscribe/:id', upcoming_customer_1.CustomerUpcomingController.upComingSubscribe);
exports.customerRouter.get('/upcoming/events/is-subscribed/:id', upcoming_customer_1.CustomerUpcomingController.upComingIsUserSubscribed);
exports.customerRouter.put('/upcoming/events/unsubscribe/:id', upcoming_customer_1.CustomerUpcomingController.upComingUnsubscribe);
// ***payments and wallets
exports.customerRouter.post('/payment/paystack/start-payment', payment_customer_1.CustomerPaymentController.startPayment);
exports.customerRouter.post('/payment/paystack/create-payment', payment_customer_1.CustomerPaymentController.createPayment);
exports.customerRouter.get('/payment/paystack/payment-receipt', payment_customer_1.CustomerPaymentController.getPaymentReceipt);
exports.customerRouter.get('/payment/paystack/transaction-history', payment_customer_1.CustomerPaymentController.transactionHistory);
exports.customerRouter.post('/payment/paystack/authorize-payment', payment_customer_1.CustomerPaymentController.authorizePayment);
exports.customerRouter.post('/wallet/topup', payment_customer_1.CustomerPaymentController.topupWallet);
exports.customerRouter.get('/wallet/fetch', payment_customer_1.CustomerPaymentController.fetchWallet);
exports.customerRouter.get('/giftcard/redeem', payment_customer_1.CustomerPaymentController.redeemGiftCard);
exports.customerRouter.get('/subscription/fetch-plans', payment_customer_1.CustomerPaymentController.fetchPlans);
exports.customerRouter.post('/subscription/create', payment_customer_1.CustomerPaymentController.createSubscription);
exports.customerRouter.get('/subscription/status', payment_customer_1.CustomerPaymentController.userSubStatus);
// *** push notification
exports.customerRouter.post('/notification/device/register', pushNotification_customer_1.CustomerPushNotificationController.registerDeviceToken);
exports.customerRouter.post('/notification/device/update', pushNotification_customer_1.CustomerPushNotificationController.updateDeviceToken);
//suggestion
exports.customerRouter.post('/suggestion/create', profile_customer_1.CustomerProfileController.createSuggestion);
// **tvshow livestream voting
exports.customerRouter.get('/livestream/vote/fetch-info', vote_custumers_1.CustomerVoteController.fetchVoteInfo);
exports.customerRouter.get('/livestream/vote/fetch-contestants', vote_custumers_1.CustomerVoteController.fetchVoteContestants);
exports.customerRouter.post('/livestream/vote/create-vote', vote_custumers_1.CustomerVoteController.createVote);
exports.customerRouter.post('/livestream/donate/dash-fund', vote_custumers_1.CustomerVoteController.donateFund);
exports.customerRouter.get('/notifications', notifications_customer_1.CustomerNotificationController.getNotifications);
exports.customerRouter.post('/notifications/:notification_id/click', notifications_customer_1.CustomerNotificationController.handleNotificationClick);
