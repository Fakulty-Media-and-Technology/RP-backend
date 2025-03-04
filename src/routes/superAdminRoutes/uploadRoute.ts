import { Router } from 'express'
import { AdminUploadController } from '../../controllers/admins/uploads.admin'
import { Multer } from '../../utils/Multer'

export const superAdminUploadsRouter = Router()

superAdminUploadsRouter.get('/fetch/:type', AdminUploadController.fetchVideos)
superAdminUploadsRouter.get('/seasons/fetch/:vidId', AdminUploadController.fetchSeasonsAndEpisodes)

superAdminUploadsRouter.post(
  '/video/add/:type',
  Multer.adminUploadVideoConfig,
  AdminUploadController.addVideo,
)

superAdminUploadsRouter.post(
  '/episodes/add/:seasonId',
  Multer.adminUploadVideoConfig,
  AdminUploadController.addEpisode,
)

superAdminUploadsRouter.post('/seasons/add/:videoId', AdminUploadController.addSeason)

superAdminUploadsRouter.put(
  '/edit/:id',
  Multer.adminUploadVideoConfig,
  AdminUploadController.editVideo,
)

superAdminUploadsRouter.delete('/remove/:id/:type', AdminUploadController.deleteVideo)
