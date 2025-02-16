"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const onboarding_admin_1 = require("../controllers/admins/onboarding.admin");
const enums_admin_1 = require("../controllers/admins/enums.admin");
const managemedia_admin_1 = require("../controllers/admins/managemedia.admin");
const upcoming_admin_1 = require("../controllers/admins/upcoming.admin");
const trailer_admin_1 = require("../controllers/admins/trailer.admin");
const plan_sub_admin_1 = require("../controllers/admins/plan-sub.admin");
const giftcard_admin_1 = require("../controllers/admins/giftcard.admin");
const payouts_admin_1 = require("../controllers/admins/payouts.admin");
const featured_admin_1 = require("../controllers/admins/featured.admin");
const uploads_admin_1 = require("../controllers/admins/uploads.admin");
const clients_admin_1 = require("../controllers/admins/clients.admin");
const suggestions_admin_1 = require("../controllers/admins/suggestions.admin");
const dashboard_admin_1 = require("../controllers/admins/dashboard.admin");
const ads_admin_1 = require("../controllers/admins/ads.admin");
const users_admin_1 = require("../controllers/admins/users.admin");
const Multer_1 = require("../utils/Multer");
const requestValidator_1 = require("../middlewares/requestValidator");
const admin_1 = require("../validations/admin");
const SharedRoutes_1 = require("../utils/SharedRoutes");
exports.superAdminRouter = express_1.default.Router();
exports.superAdminRouter.post('/admins-signin', onboarding_admin_1.AdminOnboardingController.adminSignIn);
//apply super-admin auth middleware
exports.superAdminRouter.use(auth_1.AuthMiddleware.authenticateRequest('superadmin-auth'));
exports.superAdminRouter.post('/create-super-admin', (0, requestValidator_1.requestValidator)(admin_1.createAdminORSuperAdminSchema), onboarding_admin_1.AdminOnboardingController.createAdminORSuperAdmin('superadmin'));
exports.superAdminRouter.post('/create-admin', (0, requestValidator_1.requestValidator)(admin_1.createAdminORSuperAdminSchema), onboarding_admin_1.AdminOnboardingController.createAdminORSuperAdmin('admin'));
exports.superAdminRouter.post('/create-clients', (0, requestValidator_1.requestValidator)(admin_1.createClientSchema), onboarding_admin_1.AdminOnboardingController.clientsSignup);
exports.superAdminRouter.get('/clients/allfetch', clients_admin_1.AdminClientsController.getAllClients);
exports.superAdminRouter.get('/clients/onefetch/:id', clients_admin_1.AdminClientsController.getClient);
exports.superAdminRouter.get('/clients/deposits', clients_admin_1.AdminClientsController.clientDeposits);
// **** Enums
exports.superAdminRouter.post('/enums/add-genre', (0, requestValidator_1.requestValidator)(admin_1.addGenreSchema), enums_admin_1.AdminEnumController.addGenre);
exports.superAdminRouter.get('/enums/get-genres', enums_admin_1.AdminEnumController.getGenres);
exports.superAdminRouter.delete('/enums/rem-genre/:id', enums_admin_1.AdminEnumController.remGenre);
exports.superAdminRouter.post('/enums/add-category', (0, requestValidator_1.requestValidator)(admin_1.addCategorySchema), enums_admin_1.AdminEnumController.addCategory);
exports.superAdminRouter.get('/enums/get-categories', enums_admin_1.AdminEnumController.getCategory);
exports.superAdminRouter.delete('/enums/rem-category/:id', enums_admin_1.AdminEnumController.remCategory);
exports.superAdminRouter.put('/enums/update-category/:catId', (0, requestValidator_1.requestValidator)(admin_1.updateCategorySchema), enums_admin_1.AdminEnumController.updateCategory);
exports.superAdminRouter.post('/enums/add-cast', (0, requestValidator_1.requestValidator)(admin_1.addCastSchema), enums_admin_1.AdminEnumController.addCast);
exports.superAdminRouter.get('/enums/get-cast', enums_admin_1.AdminEnumController.getCast);
exports.superAdminRouter.delete('/enums/rem-cast/:id', enums_admin_1.AdminEnumController.remcast);
// **** managed media
exports.superAdminRouter.get('/media/read-photo', (0, requestValidator_1.requestValidator)(admin_1.getPhotoURLSchema), managemedia_admin_1.AdminManagemediaController.adminGetPhotoUrl);
exports.superAdminRouter.get('/media/read-subtitle', (0, requestValidator_1.requestValidator)(admin_1.getPhotoURLSchema), managemedia_admin_1.AdminManagemediaController.adminGetSubtitleUrl);
exports.superAdminRouter.get('/media/read-video/:vidUploadId', managemedia_admin_1.AdminManagemediaController.getVidoeUploadStream);
exports.superAdminRouter.post('/media/add-subtitle', Multer_1.Multer.uploadSingleSubtitle, managemedia_admin_1.AdminManagemediaController.addSubtitle);
new SharedRoutes_1.SharedRoutes(exports.superAdminRouter).livesRoutes('Admin').fetchSubtitles();
exports.superAdminRouter.get('/lives/search-clients', managemedia_admin_1.AdminManagemediaController.searchClient);
exports.superAdminRouter.get('/lives/all/channels', managemedia_admin_1.AdminManagemediaController.getLivesByType('channel'));
exports.superAdminRouter.get('/lives/all/events', managemedia_admin_1.AdminManagemediaController.getLivesByType('event'));
exports.superAdminRouter.get('/lives/all/tvshows', managemedia_admin_1.AdminManagemediaController.getLivesByType('tvshow'));
// **** upcoming events routes
exports.superAdminRouter.post('/upcoming/event/create', Multer_1.Multer.createUpcomingConfig, upcoming_admin_1.AdminUpcomingController.createUpcomingEvent);
exports.superAdminRouter.get('/upcoming/event/getall', upcoming_admin_1.AdminUpcomingController.upcomingsAllGet);
// **** trailer
exports.superAdminRouter.post('/trailer/create', (0, requestValidator_1.requestValidator)(admin_1.createTrailerSchema), trailer_admin_1.AdminTrailerController.createTrailer);
exports.superAdminRouter.put('/trailer/update/:trailerId', (0, requestValidator_1.requestValidator)(admin_1.updateTrailerSchema), trailer_admin_1.AdminTrailerController.updateTrailer);
// **** plans and sub
exports.superAdminRouter.post('/subscription/plans/create', (0, requestValidator_1.requestValidator)(admin_1.createPlanSchema), plan_sub_admin_1.AdminPlanSubController.createPlan);
exports.superAdminRouter.put('/subscription/plans/update/:id', (0, requestValidator_1.requestValidator)(admin_1.updatePlanSchema), plan_sub_admin_1.AdminPlanSubController.updatePlan);
exports.superAdminRouter.get('/subscription/plans/fetch', plan_sub_admin_1.AdminPlanSubController.fetchPlans);
exports.superAdminRouter.delete('/subscription/plans/delete/:id', plan_sub_admin_1.AdminPlanSubController.deletePlans);
exports.superAdminRouter.get('/subscription/all/fetch', plan_sub_admin_1.AdminPlanSubController.fetchSubscriptions);
// ***** gift cards
exports.superAdminRouter.post('/giftcard/generate/new', (0, requestValidator_1.requestValidator)(admin_1.createGiftCardSchema), giftcard_admin_1.AdminGiftCardController.createGiftCard);
exports.superAdminRouter.get('/giftcard/generated/fetch', giftcard_admin_1.AdminGiftCardController.fetchGiftCards);
//payout processing
exports.superAdminRouter.get('/payouts/request/all', payouts_admin_1.AdminPayoutController.payoutReqAll);
exports.superAdminRouter.get('/payouts/request/one/:id', payouts_admin_1.AdminPayoutController.payoutReqOne);
exports.superAdminRouter.put('/payouts/request/status/:id', (0, requestValidator_1.requestValidator)(admin_1.updatePayOutReqStatusSchema), payouts_admin_1.AdminPayoutController.payoutStatusUpdate);
// superAdminRouter.get("/payouts/request/group", AdminPayoutController.payoutReqGroup);
// **** featured contents
exports.superAdminRouter.get('/featured/contents/search', featured_admin_1.AdminFeaturedController.searchContents);
exports.superAdminRouter.post('/featured/contents/add', (0, requestValidator_1.requestValidator)(admin_1.addFeaturedContentSchema), featured_admin_1.AdminFeaturedController.addFeatured);
exports.superAdminRouter.get('/featured/contents/fetch', featured_admin_1.AdminFeaturedController.getFeaturedContents);
// ***** Uploads
// Add video
exports.superAdminRouter.post('/uploads/video/add/:type', Multer_1.Multer.adminUploadVideoConfig, uploads_admin_1.AdminUploadController.addVideo);
// Add Episode
exports.superAdminRouter.post('/uploads/episodes/add/:seasonId', Multer_1.Multer.adminUploadVideoConfig, uploads_admin_1.AdminUploadController.addEpisode);
// Add Season
exports.superAdminRouter.post('/uploads/seasons/add/:videoId', Multer_1.Multer.adminUploadSeasonConfig, uploads_admin_1.AdminUploadController.addSeason);
exports.superAdminRouter.get('/uploads/seasons/fetch/:vidId', uploads_admin_1.AdminUploadController.fetchSeasonsAndEpisodes);
exports.superAdminRouter.get('/uploads/fetch/:type', uploads_admin_1.AdminUploadController.fetchVideos);
exports.superAdminRouter.put('/uploads/edit/:id/:type', uploads_admin_1.AdminUploadController.editVideo);
exports.superAdminRouter.delete('/uploads/remove/:id/:type', uploads_admin_1.AdminUploadController.deleteVideo);
// **** suggestions
exports.superAdminRouter.get('/suggestions/all', suggestions_admin_1.AdminSuggestionController.suggestionsAll);
exports.superAdminRouter.put('/suggestion/markread/:id', suggestions_admin_1.AdminSuggestionController.suggestionRead);
exports.superAdminRouter.delete('/suggestion/del/:id', suggestions_admin_1.AdminSuggestionController.suggestionDel);
// **** dashBoards
exports.superAdminRouter.get('/dashboard/profile/fetch', dashboard_admin_1.AdminDashboardController.currentAdminProfile);
exports.superAdminRouter.put('/dashboard/profile/edit', dashboard_admin_1.AdminDashboardController.editAdminProfile);
exports.superAdminRouter.get('/user/fetch', users_admin_1.AdminUsersController.adminFetchUsers);
exports.superAdminRouter.get('/user/fetch/:userId', users_admin_1.AdminUsersController.adminFetchSingleUser);
exports.superAdminRouter.patch('/user/update/:userId', users_admin_1.AdminUsersController.editUserProfile);
exports.superAdminRouter.delete('/user/deleteUser/:userId', users_admin_1.AdminUsersController.adminDeleteUser);
exports.superAdminRouter.get('/dashboard/topvideosbytype', dashboard_admin_1.AdminDashboardController.fetchVideosByType);
exports.superAdminRouter.get('/dashboard/fetchbalanceandusers', dashboard_admin_1.AdminDashboardController.fetchBalanceAndUsers);
exports.superAdminRouter.get('/dashboard/totcontentsandchunks', dashboard_admin_1.AdminDashboardController.totalContentsAndChunks);
// **** ADS
exports.superAdminRouter.post('/ads/create', (0, requestValidator_1.requestValidator)(admin_1.createAdSchema), ads_admin_1.AdminAdsController.addAds);
exports.superAdminRouter.get('/ads/fetchall', ads_admin_1.AdminAdsController.getAds);
exports.superAdminRouter.delete('/ads/remove/:id', ads_admin_1.AdminAdsController.removeAds);
// superAdminRouter.get("/dashboard/fetchchannels", AdminDashboardController.adminFetchChannel);
// superAdminRouter.get("/dashboard/countFreeUsers", AdminDashboardController.);
// superAdminRouter.get("/dashboard/countActiveUser", AdminDashboardController.countActiveUsers);
// superAdminRouter.get("/dashboard/countChannel", AdminDashboardController.countChannels);
// superAdminRouter.get("/dashboard/countEvents", AdminDashboardController.countEvents);
