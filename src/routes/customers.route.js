const express = require("express");
const {
    signIn,
    customerSignup,
    createPin,
    verifyAccount,
    passwordChangeCode,
    passwordChange,
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
} = require("../controllers/customers.controller.js/medias.customer");
const {
    customerProfileFetch,
    editProfile,
} = require("../controllers/customers.controller.js/profile.customer");

const customerRouter = express.Router();

customerRouter.post("/general-signin", signIn);

customerRouter.post("/signup", customerSignup);

customerRouter.post("/signup/createpin", createPin);

customerRouter.post("/signup/verifyaccount", verifyAccount);

customerRouter.post("/pass-reset/get-token", passwordChangeCode);

customerRouter.post("/pass-reset/change-pass", passwordChange);

//webhook, no auth mw
// customerRouter.post("/media/vod/webhook", trancodeResHook);

//no auth for vod
customerRouter.post("/media/vod-streaming", vodStream);

//apply auth middleware
customerRouter.use(customerAuth);

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

customerRouter.get("/live/events/fetch/events", getLiveEventsEven);

customerRouter.get("/live/events/fetch/tvshows", getLiveEventsTvshow);

customerRouter.get("/live/events/fetch/sports", getLiveEventsSports);

customerRouter.get("/live/events/fetch/podcasts", getLiveEventsPodcast);

customerRouter.get("/live/event/stream/:id", streamLiveEvent);

module.exports = customerRouter;
