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
const {
    uploadLargeVideoRoute,
    uploadShortVideoRoute,
    uploadImageRoute,
    readFiles,
    adminGetPhotoUrl,
    createLive,
} = require("../controllers/admins.controller.js/managemedia.admin");
const superadminAuth = require("../middlewares/superadmin.mw");

const superAdminRouter = express.Router();

superAdminRouter.post("/admins-signin", adminSignIn);

//apply super-admin auth middleware
superAdminRouter.use(superadminAuth);

superAdminRouter.post("/create-super-admin", superAdminSignup);

superAdminRouter.post("/create-admin", adminSignup);

superAdminRouter.post("/create-clients", clientsSignup);

superAdminRouter.post("/enums/add-genre", addGenre);

superAdminRouter.get("/enums/get-genres", getGenre);

superAdminRouter.delete("/enums/rem-genre/:id", remGenre);

superAdminRouter.post("/enums/add-category", addCategory);

superAdminRouter.get("/enums/get-categories", getCategory);

superAdminRouter.delete("/enums/rem-category/:id", remCategory);

superAdminRouter.post("/media/upload-vid", uploadLargeVideoRoute);

superAdminRouter.post("/media/upload-vid-short", uploadShortVideoRoute);

superAdminRouter.post("/media/upload-image", uploadImageRoute);

superAdminRouter.get("/media/read-photo", adminGetPhotoUrl);

superAdminRouter.post("/lives/create", createLive);

module.exports = superAdminRouter;
