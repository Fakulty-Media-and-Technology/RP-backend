import { Router } from 'express'
import { NotificationController } from '../../controllers/common/notification.controller'

export const notificationRouter = Router()



notificationRouter
  .route('/')
  .get(NotificationController.getUnseenNotifications)
  .put(NotificationController.updateHasSeenNotification)
