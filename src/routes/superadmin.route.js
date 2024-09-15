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
     addCast,
     getCast,
     remCast,
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
const {
     createGiftCard,
     fetchGiftCards,
} = require("../controllers/admins.controller.js/giftcard.admin");
const {
     payoutReqAll,
     payoutReqGroup,
     payoutStatusUpdate,
} = require("../controllers/admins.controller.js/payouts.admin");
const {
     searchContents,
     addToFeatured,
     getFeaturedContents,
} = require("../controllers/admins.controller.js/featured.admin");
const {
     addMovie,
     editMovie,
     deleteMovie,
     fetchMovies,
     addSkit,
     editSkit,
     deleteSkit,
     fetchSkits,
     addMusicVid,
     editMusicVid,
     fetchMusicVid,
     deleteMusicVid,
     addSeries,
     editSeries,
     deleteSeries,
     fetchSeries,
} = require("../controllers/admins.controller.js/uploads.admin");

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

superAdminRouter.post("/enums/add-cast", addCast);
superAdminRouter.get("/enums/get-cast", getCast);
superAdminRouter.delete("/enums/rem-cast/:id", remCast);

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

//gift cards
superAdminRouter.post("/giftcard/generate/new", createGiftCard);
superAdminRouter.get("/giftcard/generated/fetch", fetchGiftCards);

//payout processing
superAdminRouter.get("/payouts/request/all", payoutReqAll);
superAdminRouter.get("/payouts/request/group", payoutReqGroup);
superAdminRouter.put("/payouts/request/status/:id", payoutStatusUpdate);

//featured contents
superAdminRouter.get("/featured/contents/search", searchContents);
superAdminRouter.post("/featured/contents/add", addToFeatured);
superAdminRouter.get("/featured/contents/fetch", getFeaturedContents);

//uploads
superAdminRouter.post("/uploads/movie/add", addMovie);
superAdminRouter.put("/uploads/movie/edit/:id", editMovie);
superAdminRouter.delete("/uploads/movie/remove/:id", deleteMovie);
superAdminRouter.get("/uploads/movie/fetch", fetchMovies);

superAdminRouter.post("/uploads/skit/add", addSkit);
superAdminRouter.put("/uploads/skit/edit/:id", editSkit);
superAdminRouter.delete("/uploads/skit/remove/:id", deleteSkit);
superAdminRouter.get("/uploads/skit/fetch", fetchSkits);

superAdminRouter.post("/uploads/music-video/add", addMusicVid);
superAdminRouter.put("/uploads/music-video/edit/:id", editMusicVid);
superAdminRouter.delete("/uploads/music-video/remove/:id", deleteMusicVid);
superAdminRouter.get("/uploads/music-video/fetch", fetchMusicVid);

superAdminRouter.post("/uploads/series/add", addSeries);
superAdminRouter.put("/uploads/series/edit/:id", editSeries);
superAdminRouter.delete("/uploads/series/remove/:id", deleteSeries);
superAdminRouter.get("/uploads/series/fetch", fetchSeries);

module.exports = superAdminRouter;
