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
  addMovieOrSkitSchema,
  addMusicVideoSchema,
  addSeriesSchema,
  addSubtitleSchema,
  createAdminORSuperAdminSchema,
  createAdSchema,
  createClientSchema,
  createGiftCardSchema,
  createLiveSchema,
  createPlanSchema,
  createTrailerSchema,
  createUpcomingEventSchema,
  addEpisodeSchema,
  getPhotoURLSchema,
  updatePayOutReqStstusSchema,
  updatePlanSchema,
} from '../validations/admin'

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

superAdminRouter.post(
  '/enums/add-cast',
  requestValidator(addCastSchema),
  AdminEnumController.addCast,
)
superAdminRouter.get('/enums/get-cast', AdminEnumController.getCast)
superAdminRouter.delete('/enums/rem-cast/:id', AdminEnumController.remcast)

// **** managed media
superAdminRouter.post(
  '/media/upload-vid',
  Multer.uploadSingleVideo,
  AdminManagemediaController.uploadVideo,
)

superAdminRouter.post(
  '/media/upload-vid-short',
  Multer.uploadSingleVideo,
  AdminManagemediaController.uploadVideo,
)

superAdminRouter.post(
  '/media/upload-subtitle',
  Multer.uploadSingleSubtitle,
  AdminManagemediaController.uploadImageOrSubtitle('subtitle'),
)

superAdminRouter.post(
  '/media/upload-image',
  Multer.uploadSingleImage,
  AdminManagemediaController.uploadImageOrSubtitle('image'),
)

superAdminRouter.get(
  '/media/read-photo',
  requestValidator(getPhotoURLSchema),
  AdminManagemediaController.adminGetPhotoUrl,
)

superAdminRouter.post(
  '/media/add-subtitle',
  requestValidator(addSubtitleSchema),
  AdminManagemediaController.addSubtitle,
)

// **** lives
superAdminRouter.post(
  '/lives/create',
  requestValidator(createLiveSchema),
  AdminManagemediaController.createLive,
)

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
  requestValidator(updatePayOutReqStstusSchema),
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

superAdminRouter.post(
  '/uploads/movie/add',
  requestValidator(addMovieOrSkitSchema),
  AdminUploadController.addVideoByType('movie'),
)

superAdminRouter.post(
  '/uploads/skit/add',
  requestValidator(addMovieOrSkitSchema),
  AdminUploadController.addVideoByType('skit'),
)

superAdminRouter.post(
  '/uploads/music-video/add',
  requestValidator(addMusicVideoSchema),
  AdminUploadController.addVideoByType('music video'),
)

superAdminRouter.post(
  '/uploads/series/add',
  requestValidator(addSeriesSchema),
  AdminUploadController.addVideoByType('series'),
)

superAdminRouter.post('/uploads/seasons/add/:videoId', AdminUploadController.addSeason)

superAdminRouter.post(
  '/uploads/episodes/add/:seasonId',
  requestValidator(addEpisodeSchema),
  AdminUploadController.addEpisode,
)

// delete upload
superAdminRouter.delete(
  '/uploads/movie/remove/:id',
  AdminUploadController.deleteVideoByType('movie'),
)

superAdminRouter.delete('/uploads/skit/remove/:id', AdminUploadController.deleteVideoByType('skit'))

superAdminRouter.delete(
  '/uploads/series/remove/:id',
  AdminUploadController.deleteVideoByType('series'),
)
superAdminRouter.delete(
  '/uploads/music-video/remove/:id',
  AdminUploadController.deleteVideoByType('music video'),
)

// fetch upload
superAdminRouter.get('/uploads/movie/fetch', AdminUploadController.fetchVideosByType('movie'))
superAdminRouter.get('/uploads/skit/fetch', AdminUploadController.fetchVideosByType('skit'))
superAdminRouter.get('/uploads/series/fetch', AdminUploadController.fetchVideosByType('series'))
superAdminRouter.get(
  '/uploads/music-video/fetch',
  AdminUploadController.fetchVideosByType('music video'),
)

// edit upload
superAdminRouter.put('/uploads/movie/edit/:id', AdminUploadController.editVideoByType('movie'))
superAdminRouter.put('/uploads/skit/edit/:id', AdminUploadController.editVideoByType('skit'))
superAdminRouter.put('/uploads/series/edit/:id', AdminUploadController.editVideoByType('series'))
superAdminRouter.put(
  '/uploads/music-video/edit/:id',
  AdminUploadController.editVideoByType('music video'),
)

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
