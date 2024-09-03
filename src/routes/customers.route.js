const express = require("express");
const {
     signIn,
     customerSignup,
     createPin,
     verifyAccount,
     passwordChangeCode,
     passwordChange,
     getVerificationToken,
     authTokenValidity,
     refreshAccessToken,
     refTokenValidity,
} = require("../controllers/customers.controller.js/onboarding.customer");
const {
     notificationSettings,
     addToWatchList,
     remFromWatchList,
     addToInterest,
     remFromInterest,
} = require("../controllers/customers.controller.js/settings.customer");
const customerAuth = require("../middlewares/customer.gen.mw");
const { getVideoUrl } = require("../services/media-access");
const {
     customerGetVideoUrl,
     customerGetPhotoUrl,
     videoTranscode,
     trancodeResHook,
     checkandGetResHook,
     vodStream,
     uploadImageRoute,
     getLiveEvents,
     streamLiveEvent,
     likeEvent,
     unLikeEvent,
     userLikedEvent,
     likeVideo,
     userLikedVideo,
     unLikeVideo,
     getLiveEventsGroup,
     getLiveEventsChannels,
     getLiveEventsSponsored,
     getLiveEventsEven,
     getLiveEventsTvshow,
     getLiveEventsSports,
     getLiveEventsPodcast,
     getLiveEventsChannelsPop,
     getLiveEventsEvenPop,
     getLiveEventsTvshowPop,
     getLiveEventsSportsPop,
     getLiveEventsPodcastPop,
} = require("../controllers/customers.controller.js/medias.customer");
const {
     customerProfileFetch,
     editProfile,
     createSuggestion,
} = require("../controllers/customers.controller.js/profile.customer");
const {
     upComingFetch,
     upComingSubscribe,
     upComingIsUserSubscribed,
     upComingUnsubscribe,
} = require("../controllers/customers.controller.js/upcoming.customer");
const {
     startPayment,
     getPaymentReceipt,
     createPayment,
     topupWallet,
     fetchWallet,
     fetchPlans,
     createSubscription,
     redeemGiftCard,
     userSubStatus,
     transactionHistory,
     addPayment,
     authorizePayment,
} = require("../controllers/customers.controller.js/payment.customer");
const {
     registerDeviceToken,
     updateDeviceToken,
} = require("../controllers/customers.controller.js/pushNotification.customer");
const {
     fetchVoteContestants,
     fetchVoteInfo,
     createVote,
     donateFund,
} = require("../controllers/customers.controller.js/vote.custumers");

const customerRouter = express.Router();

customerRouter.post("/general-signin", signIn);

customerRouter.get("/general/validate-token", authTokenValidity);

customerRouter.get("/general/validate-reftoken", refTokenValidity);

customerRouter.get("/general/renew-accesstoken", refreshAccessToken);

customerRouter.post("/signup", customerSignup);

customerRouter.get("/verification/get-token", getVerificationToken);

customerRouter.post("/signup/verifyaccount", verifyAccount);

customerRouter.post("/pass-reset/get-token", passwordChangeCode);

customerRouter.post("/pass-reset/change-pass", passwordChange);

//webhook, no auth mw
// customerRouter.post("/media/vod/webhook", trancodeResHook);

//no auth for vod

//apply auth middleware
customerRouter.use(customerAuth);

customerRouter.post("/media/vod-streaming", vodStream);

customerRouter.post("/signup/createpin", createPin);

customerRouter.get("/profile/fetch", customerProfileFetch);

customerRouter.put("/profile/edit", editProfile);

customerRouter.put("/settings/notification-vidquality", notificationSettings);

customerRouter.post("/settings/watchlist/add", addToWatchList);

customerRouter.post("/settings/watchlist/rem", remFromWatchList);

customerRouter.post("/settings/interest/add", addToInterest);

// customerRouter.post("/settings/interest/rem", remFromInterest);

customerRouter.post("/media/upload-photo", uploadImageRoute);

// customerRouter.post("/media/photo-url", customerGetPhotoUrl);

customerRouter.post("/media/vod/like/:id", likeVideo);

customerRouter.get("/media/vod/userliked/:id", userLikedVideo);

customerRouter.post("/media/vod/unlike/:id", unLikeVideo);

//live events
customerRouter.get("/live/events/fetch/all", getLiveEvents);

customerRouter.get("/live/events/fetch/sponsored", getLiveEventsSponsored);

customerRouter.get("/live/events/fetch/channels", getLiveEventsChannels);
customerRouter.get("/live/events/fetch/pop/channels", getLiveEventsChannelsPop);

customerRouter.get("/live/events/fetch/events", getLiveEventsEven);
customerRouter.get("/live/events/fetch/pop/events", getLiveEventsEvenPop);

customerRouter.get("/live/events/fetch/tvshows", getLiveEventsTvshow);
customerRouter.get("/live/events/fetch/pop/tvshows", getLiveEventsTvshowPop);

customerRouter.get("/live/events/fetch/sports", getLiveEventsSports);
customerRouter.get("/live/events/fetch/pop/sports", getLiveEventsSportsPop);

customerRouter.get("/live/events/fetch/podcasts", getLiveEventsPodcast);
customerRouter.get("/live/events/fetch/pop/podcasts", getLiveEventsPodcastPop);

customerRouter.get("/live/event/stream/:id", streamLiveEvent);

//Upcoming Events
customerRouter.get("/upcoming/events/fetch", upComingFetch);

customerRouter.put("/upcoming/events/subscribe/:id", upComingSubscribe);

customerRouter.get(
     "/upcoming/events/is-subscribed/:id",
     upComingIsUserSubscribed
);

customerRouter.put("/upcoming/events/unsubscribe/:id", upComingUnsubscribe);

//payments and wallets
customerRouter.post("/payment/paystack/start-payment", startPayment);

customerRouter.post("/payment/paystack/create-payment", createPayment);

customerRouter.get("/payment/paystack/payment-receipt", getPaymentReceipt);

customerRouter.get("/payment/paystack/transaction-history", transactionHistory);

// customerRouter.put("/payment/paystack/add-payment", addPayment);

customerRouter.post("/payment/paystack/authorize-payment", authorizePayment);

customerRouter.post("/wallet/topup", topupWallet);

customerRouter.get("/wallet/fetch", fetchWallet);

customerRouter.get("/giftcard/redeem", redeemGiftCard);

customerRouter.get("/subscription/fetch-plans", fetchPlans);

customerRouter.post("/subscription/create", createSubscription);

customerRouter.get("/subscription/status", userSubStatus);

//push notification
customerRouter.post("/notification/device/register", registerDeviceToken);

customerRouter.post("/notification/device/update", updateDeviceToken);

//suggestion
customerRouter.post("/suggestion/create", createSuggestion);

//tvshow livestream voting
customerRouter.get("/livestream/vote/fetch-info", fetchVoteInfo);

customerRouter.get("/livestream/vote/fetch-contestants", fetchVoteContestants);

customerRouter.post("/livestream/vote/create-vote", createVote);

customerRouter.post("/livestream/donate/dash-fund", donateFund);

module.exports = customerRouter;
