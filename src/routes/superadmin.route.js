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
const {
     createUpcomingEvent,
} = require("../controllers/admins.controller.js/upcoming.admin");
const {
     createTrailer,
} = require("../controllers/admins.controller.js/trailer.admin");
const {
     createPlan,
     updatePlan,
     deletePlans,
     fetchPlans,
} = require("../controllers/admins.controller.js/plan-sub.admin");

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

//upcoming events routes
superAdminRouter.post("/upcoming/event/create", createUpcomingEvent);

//trailer
superAdminRouter.post("/trailer/create", createTrailer);

//plans and sub
superAdminRouter.post("/subscription/plans/create", createPlan);

superAdminRouter.put("/subscription/plans/update/:id", updatePlan);

superAdminRouter.get("/subscription/plans/fetch", fetchPlans);
superAdminRouter.delete("/subscription/plans/delete/:id", deletePlans);


module.exports = superAdminRouter;
