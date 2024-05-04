const express = require("express");
const {
    signIn,
    customerSignup,
    createPin,
    verifyAccount,
} = require("../controllers/customers.controller.js/onboarding.customer");

const customerRouter = express.Router();

customerRouter.post("/general-signin", signIn);

customerRouter.post("/signup", customerSignup);

customerRouter.post("/signup/createpin", createPin);

customerRouter.post("/signup/verifyaccount", verifyAccount);

//apply auth middleware

module.exports = customerRouter;
