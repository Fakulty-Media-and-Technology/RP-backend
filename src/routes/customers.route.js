const express = require("express");
const {
    signIn,
    customerSignup,
    createPin,
    verifyAccount,
} = require("../controllers/customers.controller.js/onboarding.customer");
const {
    notificationSettings,
    addToWatchList,
    remFromWatchList,
    addToInterest,
    remFromInterest,
} = require("../controllers/customers.controller.js/settings.customer");
const customerAuth = require("../middlewares/customer.gen.mw");

const customerRouter = express.Router();

customerRouter.post("/general-signin", signIn);

customerRouter.post("/signup", customerSignup);

customerRouter.post("/signup/createpin", createPin);

customerRouter.post("/signup/verifyaccount", verifyAccount);

//apply auth middleware
customerRouter.use(customerAuth);

customerRouter.put("/settings/notification-vidquality", notificationSettings);

customerRouter.post("/settings/watchlist/add", addToWatchList);

customerRouter.post("/settings/watchlist/rem", remFromWatchList);

customerRouter.post("/settings/interest/add", addToInterest);

customerRouter.post("/settings/interest/rem", remFromInterest);

module.exports = customerRouter;
