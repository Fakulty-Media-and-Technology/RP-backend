import express from 'express'
import { AuthMiddleware } from '../middlewares/auth'

import { AdminOnboardingController } from '../controllers/admins/onboarding.admin'
import { AdminEnumController } from '../controllers/admins/enums.admin'
import { AdminManagemediaController } from '../controllers/admins/managemedia.admin'
import { AdminUpcomingController } from '../controllers/admins/upcoming.admin'
import { AdminTrailerController } from '../controllers/admins/trailer.admin'
import { AdminPlanSubController } from '../controllers/admins/plan-sub.admin'
import { AdminGiftCardController } from '../controllers/admins/giftcard.admin'
import { AdminPayoutController } from '../controllers/admins/payouts.admin'
import { AdminFeaturedController } from '../controllers/admins/featured.admin'
import { AdminUploadController } from '../controllers/admins/uploads.admin'
import { AdminClientsController } from '../controllers/admins/clients.admin'
import { AdminSuggestionController } from '../controllers/admins/suggestions.admin'
import { AdminDashboardController } from '../controllers/admins/dashboard.admin'
import { AdminAdsController } from '../controllers/admins/ads.admin'
import { AdminUsersController } from '../controllers/admins/users.admin'
import { Multer } from '../utils/Multer'
import { requestValidator } from '../middlewares/requestValidator'

import {
  addCastSchema,
  addCategorySchema,
  addFeaturedContentSchema,
  addGenreSchema,
  addSubtitleSchema,
  createAdminORSuperAdminSchema,
  createAdSchema,
  createClientSchema,
  createGiftCardSchema,
  createLiveSchema,
  createPlanSchema,
  createTrailerSchema,
  createUpcomingEventSchema,
  getPhotoURLSchema,
  updatePayOutReqStatusSchema,
  updatePlanSchema,
  updateCategorySchema,
  updateTrailerSchema,
} from '../validations/admin'
import { SharedRoutes } from '../utils/SharedRoutes'

export const superAdminRouter = express.Router()

superAdminRouter.post('/admins-signin', AdminOnboardingController.adminSignIn)

//apply super-admin auth middleware
superAdminRouter.use(AuthMiddleware.authenticateRequest('superadmin-auth'))

superAdminRouter.post(
  '/create-super-admin',
  requestValidator(createAdminORSuperAdminSchema),
  AdminOnboardingController.createAdminORSuperAdmin('superadmin'),
)

superAdminRouter.post(
  '/create-admin',
  requestValidator(createAdminORSuperAdminSchema),
  AdminOnboardingController.createAdminORSuperAdmin('admin'),
)

superAdminRouter.post(
  '/create-clients',
  requestValidator(createClientSchema),
  AdminOnboardingController.clientsSignup,
)

superAdminRouter.get('/clients/allfetch', AdminClientsController.getAllClients)
superAdminRouter.get('/clients/onefetch/:id', AdminClientsController.getClient)
superAdminRouter.get('/clients/deposits', AdminClientsController.clientDeposits)

// **** Enums
superAdminRouter.post(
  '/enums/add-genre',
  requestValidator(addGenreSchema),
  AdminEnumController.addGenre,
)

superAdminRouter.get('/enums/get-genres', AdminEnumController.getGenres)
superAdminRouter.delete('/enums/rem-genre/:id', AdminEnumController.remGenre)

superAdminRouter.post(
  '/enums/add-category',
  requestValidator(addCategorySchema),
  AdminEnumController.addCategory,
)

superAdminRouter.get('/enums/get-categories', AdminEnumController.getCategory)
superAdminRouter.delete('/enums/rem-category/:id', AdminEnumController.remCategory)

superAdminRouter.put(
  '/enums/update-category/:catId',
  requestValidator(updateCategorySchema),
  AdminEnumController.updateCategory,
)

superAdminRouter.post(
  '/enums/add-cast',
  requestValidator(addCastSchema),
  AdminEnumController.addCast,
)

superAdminRouter.get('/enums/get-cast', AdminEnumController.getCast)
superAdminRouter.delete('/enums/rem-cast/:id', AdminEnumController.remcast)

// **** managed media

superAdminRouter.get(
  '/media/read-photo',
  requestValidator(getPhotoURLSchema),
  AdminManagemediaController.adminGetPhotoUrl,
)

superAdminRouter.get(
  '/media/read-subtitle',
  requestValidator(getPhotoURLSchema),
  AdminManagemediaController.adminGetSubtitleUrl,
)

superAdminRouter.get(
  '/media/read-video/:vidUploadId',
  AdminManagemediaController.getVidoeUploadStream,
)

superAdminRouter.post(
  '/media/add-subtitle',
  requestValidator(addSubtitleSchema),
  AdminManagemediaController.addSubtitle,
)

new SharedRoutes(superAdminRouter).livesRoutes('Admin')

superAdminRouter.get('/lives/search-clients', AdminManagemediaController.searchClient)
superAdminRouter.get('/lives/all/channels', AdminManagemediaController.getLivesByType('channel'))
superAdminRouter.get('/lives/all/events', AdminManagemediaController.getLivesByType('event'))
superAdminRouter.get('/lives/all/tvshows', AdminManagemediaController.getLivesByType('tvshow'))

// **** upcoming events routes
superAdminRouter.post(
  '/upcoming/event/create',
  requestValidator(createUpcomingEventSchema),
  AdminUpcomingController.createUpcomingEvent,
)

superAdminRouter.get('/upcoming/event/getall', AdminUpcomingController.upcomingsAllGet)

// **** trailer
superAdminRouter.post(
  '/trailer/create',
  requestValidator(createTrailerSchema),
  AdminTrailerController.createTrailer,
)

superAdminRouter.put(
  '/trailer/update/:trailerId',
  requestValidator(updateTrailerSchema),
  AdminTrailerController.updateTrailer,
)

// **** plans and sub
superAdminRouter.post(
  '/subscription/plans/create',
  requestValidator(createPlanSchema),
  AdminPlanSubController.createPlan,
)

superAdminRouter.put(
  '/subscription/plans/update/:id',
  requestValidator(updatePlanSchema),
  AdminPlanSubController.updatePlan,
)

superAdminRouter.get('/subscription/plans/fetch', AdminPlanSubController.fetchPlans)
superAdminRouter.delete('/subscription/plans/delete/:id', AdminPlanSubController.deletePlans)
superAdminRouter.get('/subscription/all/fetch', AdminPlanSubController.fetchSubscriptions)

// ***** gift cards
superAdminRouter.post(
  '/giftcard/generate/new',
  requestValidator(createGiftCardSchema),
  AdminGiftCardController.createGiftCard,
)

superAdminRouter.get('/giftcard/generated/fetch', AdminGiftCardController.fetchGiftCards)

//payout processing
superAdminRouter.get('/payouts/request/all', AdminPayoutController.payoutReqAll)
superAdminRouter.get('/payouts/request/one/:id', AdminPayoutController.payoutReqOne)

superAdminRouter.put(
  '/payouts/request/status/:id',
  requestValidator(updatePayOutReqStatusSchema),
  AdminPayoutController.payoutStatusUpdate,
)
// superAdminRouter.get("/payouts/request/group", AdminPayoutController.payoutReqGroup);

// **** featured contents
superAdminRouter.get('/featured/contents/search', AdminFeaturedController.searchContents)

superAdminRouter.post(
  '/featured/contents/add',
  requestValidator(addFeaturedContentSchema),
  AdminFeaturedController.addFeatured,
)
superAdminRouter.get('/featured/contents/fetch', AdminFeaturedController.getFeaturedContents)

// ***** Uploads

// Add video
superAdminRouter.post(
  '/uploads/video/add/:type',
  Multer.adminUploadVideoConfig,
  AdminUploadController.addVideo,
)

// Add Episode
superAdminRouter.post(
  '/uploads/episodes/add/:seasonId',
  Multer.adminUploadVideoConfig,
  AdminUploadController.addEpisode,
)

// Add Season
superAdminRouter.post(
  '/uploads/seasons/add/:videoId',
  Multer.adminUploadSeasonConfig,
  AdminUploadController.addSeason,
)

superAdminRouter.get('/uploads/seasons/fetch/:vidId', AdminUploadController.fetchSeasonsAndEpisodes)

superAdminRouter.get('/uploads/fetch/:type', AdminUploadController.fetchVideos)
superAdminRouter.put('/uploads/edit/:id/:type', AdminUploadController.editVideo)
superAdminRouter.delete('/uploads/remove/:id/:type', AdminUploadController.deleteVideo)

// **** suggestions
superAdminRouter.get('/suggestions/all', AdminSuggestionController.suggestionsAll)
superAdminRouter.put('/suggestion/markread/:id', AdminSuggestionController.suggestionRead)
superAdminRouter.delete('/suggestion/del/:id', AdminSuggestionController.suggestionDel)

// **** dashBoards
superAdminRouter.get('/dashboard/profile/fetch', AdminDashboardController.currentAdminProfile)
superAdminRouter.put('/dashboard/profile/edit', AdminDashboardController.editAdminProfile)

superAdminRouter.get('/user/fetch', AdminUsersController.adminFetchUsers)
superAdminRouter.get('/user/fetch/:userId', AdminUsersController.adminFetchSingleUser)
superAdminRouter.patch('/user/update/:userId', AdminUsersController.editUserProfile)
superAdminRouter.delete('/user/deleteUser/:userId', AdminUsersController.adminDeleteUser)

superAdminRouter.get('/dashboard/topvideosbytype', AdminDashboardController.fetchVideosByType)
superAdminRouter.get(
  '/dashboard/fetchbalanceandusers',
  AdminDashboardController.fetchBalanceAndUsers,
)
superAdminRouter.get(
  '/dashboard/totcontentsandchunks',
  AdminDashboardController.totalContentsAndChunks,
)

// **** ADS
superAdminRouter.post('/ads/create', requestValidator(createAdSchema), AdminAdsController.addAds)
superAdminRouter.get('/ads/fetchall', AdminAdsController.getAds)
superAdminRouter.delete('/ads/remove/:id', AdminAdsController.removeAds)

// superAdminRouter.get("/dashboard/fetchchannels", AdminDashboardController.adminFetchChannel);
// superAdminRouter.get("/dashboard/countFreeUsers", AdminDashboardController.);
// superAdminRouter.get("/dashboard/countActiveUser", AdminDashboardController.countActiveUsers);
// superAdminRouter.get("/dashboard/countChannel", AdminDashboardController.countChannels);
// superAdminRouter.get("/dashboard/countEvents", AdminDashboardController.countEvents);
