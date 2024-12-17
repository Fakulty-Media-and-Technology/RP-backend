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

export const superAdminRouter = express.Router()

superAdminRouter.post('/admins-signin', AdminOnboardingController.adminSignIn)

//apply super-admin auth middleware
superAdminRouter.use(AuthMiddleware.authenticateRequest('superadmin-auth'))

superAdminRouter.post('/create-super-admin', AdminOnboardingController.superAdminSignup)
superAdminRouter.post('/create-admin', AdminOnboardingController.adminSignup)
superAdminRouter.post('/create-clients', AdminOnboardingController.clientsSignup)

superAdminRouter.get('/clients/allfetch', AdminClientsController.getAllClients)
superAdminRouter.get('/clients/onefetch/:id', AdminClientsController.getClient)
superAdminRouter.get('/clients/deposits', AdminClientsController.clientDeposits)

superAdminRouter.post('/enums/add-genre', AdminEnumController.addGenre)
superAdminRouter.get('/enums/get-genres', AdminEnumController.getGenres)
superAdminRouter.delete('/enums/rem-genre/:id', AdminEnumController.remGenre)
superAdminRouter.post('/enums/add-category', AdminEnumController.addCategory)
superAdminRouter.get('/enums/get-categories', AdminEnumController.getCategory)
superAdminRouter.delete('/enums/rem-category/:id', AdminEnumController.remCategory)
superAdminRouter.post('/enums/add-cast', AdminEnumController.addCast)
superAdminRouter.get('/enums/get-cast', AdminEnumController.getCast)
superAdminRouter.delete('/enums/rem-cast/:id', AdminEnumController.remcast)

superAdminRouter.post('/media/upload-vid', AdminManagemediaController.uploadLargeVideoRoute)
superAdminRouter.post('/media/upload-vid-short', AdminManagemediaController.uploadShortVideoRoute)
superAdminRouter.post('/media/upload-subtitle', AdminManagemediaController.uploadVidSubtitle)
superAdminRouter.post('/media/upload-image', AdminManagemediaController.uploadImageRoute)
superAdminRouter.get('/media/read-photo', AdminManagemediaController.adminGetPhotoUrl)
superAdminRouter.post('/media/add-subtitle', AdminManagemediaController.addSubtitle)
superAdminRouter.post('/lives/create', AdminManagemediaController.createLive)
superAdminRouter.get('/lives/search-clients', AdminManagemediaController.searchClient)
superAdminRouter.get('/lives/all/channels', AdminManagemediaController.livesChannels)
superAdminRouter.get('/lives/all/events', AdminManagemediaController.livesEvents)
superAdminRouter.get('/lives/all/tvshows', AdminManagemediaController.livesTvshows)

//upcoming events routes
superAdminRouter.post('/upcoming/event/create', AdminUpcomingController.createUpcomingEvent)
superAdminRouter.get('/upcoming/event/getall', AdminUpcomingController.upcomingsAllGet)

//trailer
superAdminRouter.post('/trailer/create', AdminTrailerController.createTrailer)

//plans and sub
superAdminRouter.post('/subscription/plans/create', AdminPlanSubController.createPlan)
superAdminRouter.put('/subscription/plans/update/:id', AdminPlanSubController.updatePlan)
superAdminRouter.get('/subscription/plans/fetch', AdminPlanSubController.fetchPlans)
superAdminRouter.delete('/subscription/plans/delete/:id', AdminPlanSubController.deletePlans)
superAdminRouter.get('/subscription/all/fetch', AdminPlanSubController.fetchSubscriptions)

//gift cards
superAdminRouter.post('/giftcard/generate/new', AdminGiftCardController.createGiftCard)
superAdminRouter.get('/giftcard/generated/fetch', AdminGiftCardController.fetchGiftCards)

//payout processing
superAdminRouter.get('/payouts/request/all', AdminPayoutController.payoutReqAll)
superAdminRouter.get('/payouts/request/one/:id', AdminPayoutController.payoutReqOne)
superAdminRouter.put('/payouts/request/status/:id', AdminPayoutController.payoutStatusUpdate)
// superAdminRouter.get("/payouts/request/group", AdminPayoutController.payoutReqGroup);

//featured contents
superAdminRouter.get('/featured/contents/search', AdminFeaturedController.searchContents)
superAdminRouter.post('/featured/contents/add', AdminFeaturedController.addFeatured)
superAdminRouter.get('/featured/contents/fetch', AdminFeaturedController.getFeaturedContents)

//uploads
superAdminRouter.post('/uploads/movie/add', AdminUploadController.addMovie)
superAdminRouter.put('/uploads/movie/edit/:id', AdminUploadController.editMovie)
superAdminRouter.delete('/uploads/movie/remove/:id', AdminUploadController.deleteMovie)
superAdminRouter.get('/uploads/movie/fetch', AdminUploadController.fetchMovies)
superAdminRouter.post('/uploads/skit/add', AdminUploadController.addSkit)
superAdminRouter.put('/uploads/skit/edit/:id', AdminUploadController.editSkit)
superAdminRouter.delete('/uploads/skit/remove/:id', AdminUploadController.deleteSkit)
superAdminRouter.get('/uploads/skit/fetch', AdminUploadController.fetchSkits)
superAdminRouter.post('/uploads/music-video/add', AdminUploadController.addMusicVid)
superAdminRouter.put('/uploads/music-video/edit/:id', AdminUploadController.editMusicVid)
superAdminRouter.delete('/uploads/music-video/remove/:id', AdminUploadController.deleteMusicVid)
superAdminRouter.get('/uploads/music-video/fetch', AdminUploadController.fetchMusicVid)
superAdminRouter.post('/uploads/series/add', AdminUploadController.addSeries)
superAdminRouter.put('/uploads/series/edit/:id', AdminUploadController.editSeries)
superAdminRouter.delete('/uploads/series/remove/:id', AdminUploadController.deleteSeries)
superAdminRouter.get('/uploads/series/fetch', AdminUploadController.fetchSeries)

superAdminRouter.get('/suggestions/all', AdminSuggestionController.suggestionsAll)
superAdminRouter.put('/suggestion/markread/:id', AdminSuggestionController.suggestionRead)
superAdminRouter.delete('/suggestion/del/:id', AdminSuggestionController.suggestionDel)

//DashBoards
superAdminRouter.get('/dashboard/profile/fetch', AdminDashboardController.currentAdminProfile)
superAdminRouter.put('/dashboard/profile/edit', AdminDashboardController.editAdminProfile)

superAdminRouter.get('/user/fetch', AdminUsersController.adminFetchUser)
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

//ADS
superAdminRouter.post('/ads/create', AdminAdsController.addAds)
superAdminRouter.get('/ads/fetchall', AdminAdsController.getAds)
superAdminRouter.delete('/ads/remove/:id', AdminAdsController.removeAds)

// superAdminRouter.get("/dashboard/fetchchannels", AdminDashboardController.adminFetchChannel);
// superAdminRouter.get("/dashboard/countFreeUsers", AdminDashboardController.);
// superAdminRouter.get("/dashboard/countActiveUser", AdminDashboardController.countActiveUsers);
// superAdminRouter.get("/dashboard/countChannel", AdminDashboardController.countChannels);
// superAdminRouter.get("/dashboard/countEvents", AdminDashboardController.countEvents);
