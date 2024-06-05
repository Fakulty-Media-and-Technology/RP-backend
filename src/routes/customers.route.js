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
const { getVideoUrl } = require("../utils/media-access");
const {
    customerGetVideoUrl,
    customerGetPhotoUrl,
    videoTranscode,
    trancodeResHook,
    checkandGetResHook,
    vodStream,
} = require("../controllers/customers.controller.js/medias.customer");

const customerRouter = express.Router();

customerRouter.post("/general-signin", signIn);

customerRouter.post("/signup", customerSignup);

customerRouter.post("/signup/createpin", createPin);

customerRouter.post("/signup/verifyaccount", verifyAccount);

customerRouter.post("/pass-reset/get-token", passwordChangeCode);

customerRouter.post("/pass-reset/change-pass", passwordChange);

//webhook, no auth mw
customerRouter.post("/media/vod/webhook", trancodeResHook);

//apply auth middleware
customerRouter.use(customerAuth);

customerRouter.put("/settings/notification-vidquality", notificationSettings);

customerRouter.post("/settings/watchlist/add", addToWatchList);

customerRouter.post("/settings/watchlist/rem", remFromWatchList);

customerRouter.post("/settings/interest/add", addToInterest);

customerRouter.post("/settings/interest/rem", remFromInterest);

customerRouter.post("/media/photo-url", customerGetPhotoUrl);

customerRouter.post("/media/vod-streaming", vodStream);

// customerRouter.get("/media/vod/url/:id", checkandGetResHook);

module.exports = customerRouter;
