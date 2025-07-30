import { Router } from 'express'
import { Multer } from '../../utils/Multer'
import { NotificationController } from '../../controllers/common/notification.controller'

export const superAdminNotificationRouter = Router()

superAdminNotificationRouter.post(
  '/create',
  Multer.uploadSingleImage,
  NotificationController.createAdminNotification,
)
