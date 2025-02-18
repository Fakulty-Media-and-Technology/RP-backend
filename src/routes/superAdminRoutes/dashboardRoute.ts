import { Router } from 'express'
import { AdminDashboardController } from '../../controllers/admins/dashboard.admin'

export const superAdminDashboardRouter = Router()

superAdminDashboardRouter.get('/profile/fetch', AdminDashboardController.currentAdminProfile)
superAdminDashboardRouter.put('/profile/edit', AdminDashboardController.editAdminProfile)
superAdminDashboardRouter.get('/topvideosbytype', AdminDashboardController.fetchVideosByType)

superAdminDashboardRouter.get(
  '/fetchbalanceandusers',
  AdminDashboardController.fetchBalanceAndUsers,
)
superAdminDashboardRouter.get(
  '/totcontentsandchunks',
  AdminDashboardController.totalContentsAndChunks,
)

// superAdminRouter.get("/fetchchannels", AdminDashboardController.adminFetchChannel);
// superAdminRouter.get("/countFreeUsers", AdminDashboardController.);
// superAdminRouter.get("/countActiveUser", AdminDashboardController.countActiveUsers);
// superAdminRouter.get("/countChannel", AdminDashboardController.countChannels);
// superAdminRouter.get("/countEvents", AdminDashboardController.countEvents);
