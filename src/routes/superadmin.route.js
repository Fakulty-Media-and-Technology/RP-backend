const express = require("express");
const {
    superAdminSignup,
    adminSignup,
    clientsSignup,
    adminSignIn,
} = require("../controllers/admins.controller.js/onboarding.admin");

const superAdminRouter = express.Router();

superAdminRouter.post("/admins-signin", adminSignIn);

//apply super-admin auth middleware

superAdminRouter.post("/create-super-admin", superAdminSignup);

superAdminRouter.post("/create-admin", adminSignup);

superAdminRouter.post("/create-clients", clientsSignup);

module.exports = superAdminRouter;
