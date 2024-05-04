const express = require("express");
const {
    signIn,
    customerSignup,
} = require("../controllers/customers.controller.js/onboarding.customer");

const customerRouter = express.Router();

customerRouter.post("/general-signin", signIn);

customerRouter.post("/signup", customerSignup);

//apply auth middleware

module.exports = customerRouter;
