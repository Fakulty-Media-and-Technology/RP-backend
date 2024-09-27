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
     uploadVidSubtitle,
     addSubtitle,
     searchClient,
     livesChannels,
     livesEvents,
     livesTvshows,
} = require("../controllers/admins.controller.js/managemedia.admin");
const superadminAuth = require("../middlewares/superadmin.mw");
const {
     createUpcomingEvent,
     upcomingsAllGet,
} = require("../controllers/admins.controller.js/upcoming.admin");
const {
     createTrailer,
} = require("../controllers/admins.controller.js/trailer.admin");
const {
     createPlan,
     updatePlan,
     deletePlans,
     fetchPlans,
     fetchSubscriptions,
} = require("../controllers/admins.controller.js/plan-sub.admin");
const {
     createGiftCard,
     fetchGiftCards,
} = require("../controllers/admins.controller.js/giftcard.admin");
const {
     payoutReqAll,
     payoutReqGroup,
     payoutStatusUpdate,
     payoutReqOne,
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
const {
     getAllClients,
     getAClient,
     clientDeposits,
} = require("../controllers/admins.controller.js/clients.admin");
const {
     suggestionsAll,
     suggestionRead,
     suggestionDel,
} = require("../controllers/admins.controller.js/suggestions.admin");

const {
     adminFetchUser,
     adminUpdateUser,
     adminDeleteUser,
     adminOneUser,
} = require("../controllers/admins.controller.js/users.admin");
const {
     fetchUsersByVideoType,
     adminFetchChannel,
     adminFetchBalanceAndUser,
     countFreeUsers,
     countActiveUsers,
     countChannels,
     countEvents,
     currentAdminProfile,
     editAdminProfile,
     fetchTopVideosByType,
     totContentsAndChunks,
} = require("../controllers/admins.controller.js/dashboard.admin");
const {
     addAds,
     getAds,
     remAds,
} = require("../controllers/admins.controller.js/ads.admin");

const superAdminRouter = express.Router();

superAdminRouter.post("/admins-signin", adminSignIn);

//apply super-admin auth middleware
superAdminRouter.use(superadminAuth);

superAdminRouter.post("/create-super-admin", superAdminSignup);
superAdminRouter.post("/create-admin", adminSignup);

superAdminRouter.post("/create-clients", clientsSignup);
superAdminRouter.get("/clients/allfetch", getAllClients);
superAdminRouter.get("/clients/onefetch/:id", getAClient);
superAdminRouter.get("/clients/deposits", clientDeposits);

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
superAdminRouter.post("/media/upload-subtitle", uploadVidSubtitle);
superAdminRouter.post("/media/upload-image", uploadImageRoute);
superAdminRouter.get("/media/read-photo", adminGetPhotoUrl);

superAdminRouter.post("/media/add-subtitle", addSubtitle);

superAdminRouter.post("/lives/create", createLive);
superAdminRouter.get("/lives/search-clients", searchClient);
superAdminRouter.get("/lives/all/channels", livesChannels);
superAdminRouter.get("/lives/all/events", livesEvents);
superAdminRouter.get("/lives/all/tvshows", livesTvshows);

//upcoming events routes
superAdminRouter.post("/upcoming/event/create", createUpcomingEvent);
superAdminRouter.get("/upcoming/event/getall", upcomingsAllGet);

//trailer
superAdminRouter.post("/trailer/create", createTrailer);

//plans and sub
superAdminRouter.post("/subscription/plans/create", createPlan);
superAdminRouter.put("/subscription/plans/update/:id", updatePlan);
superAdminRouter.get("/subscription/plans/fetch", fetchPlans);
superAdminRouter.delete("/subscription/plans/delete/:id", deletePlans);
superAdminRouter.get("/subscription/all/fetch", fetchSubscriptions);

//gift cards
superAdminRouter.post("/giftcard/generate/new", createGiftCard);
superAdminRouter.get("/giftcard/generated/fetch", fetchGiftCards);

//payout processing
superAdminRouter.get("/payouts/request/all", payoutReqAll);
superAdminRouter.get("/payouts/request/one/:id", payoutReqOne);
// superAdminRouter.get("/payouts/request/group", payoutReqGroup);
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

superAdminRouter.get("/suggestions/all", suggestionsAll);
superAdminRouter.put("/suggestion/markread/:id", suggestionRead);
superAdminRouter.delete("/suggestion/del/:id", suggestionDel);

//DashBoards
superAdminRouter.get("/dashboard/profile/fetch", currentAdminProfile);
superAdminRouter.put("/dashboard/profile/edit", editAdminProfile);

superAdminRouter.get("/user/fetch", adminFetchUser);
superAdminRouter.get("/user/fetch/:userId", adminOneUser);
superAdminRouter.patch("/user/update/:userId", adminUpdateUser);
superAdminRouter.delete("/user/deleteUser/:userId", adminDeleteUser);

superAdminRouter.get("/dashboard/topvideosbytype", fetchTopVideosByType);
// superAdminRouter.get("/dashboard/fetchchannels", adminFetchChannel);
superAdminRouter.get(
     "/dashboard/fetchbalanceandusers",
     adminFetchBalanceAndUser
);
superAdminRouter.get("/dashboard/totcontentsandchunks", totContentsAndChunks);

// superAdminRouter.get("/dashboard/countFreeUsers", countFreeUsers);
// superAdminRouter.get("/dashboard/countActiveUser", countActiveUsers);
// superAdminRouter.get("/dashboard/countChannel", countChannels);
// superAdminRouter.get("/dashboard/countEvents", countEvents);

//ADS
superAdminRouter.post("/ads/create", addAds);
superAdminRouter.get("/ads/fetchall", getAds);
superAdminRouter.delete("/ads/remove/:id", remAds);

module.exports = superAdminRouter;
