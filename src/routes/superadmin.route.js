const express = require("express");
const {
    superAdminSignup,
    adminSignup,
    clientsSignup,
    adminSignIn,
} = require("../controllers/admins.controller.js/onboarding.admin");
const {
    addGenre,
    getGenre,
    remGenre,
    addCategory,
    getCategory,
    remCategory,
} = require("../controllers/admins.controller.js/enums.admin");

const superAdminRouter = express.Router();

superAdminRouter.post("/admins-signin", adminSignIn);

//apply super-admin auth middleware

superAdminRouter.post("/create-super-admin", superAdminSignup);

superAdminRouter.post("/create-admin", adminSignup);

superAdminRouter.post("/create-clients", clientsSignup);

superAdminRouter.post("/enums/add-genre", addGenre);

superAdminRouter.get("/enums/get-genres", getGenre);

superAdminRouter.delete("/enums/rem-genre/:id", remGenre);

superAdminRouter.post("/enums/add-category", addCategory);

superAdminRouter.get("/enums/get-categories", getCategory);

superAdminRouter.delete("/enums/rem-category/:id", remCategory);

module.exports = superAdminRouter;
