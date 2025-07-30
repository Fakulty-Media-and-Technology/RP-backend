import { Router } from 'express'
import { NotificationController } from '../../controllers/common/notification.controller'

export const clientNotificationRouter = Router()

clientNotificationRouter.post('/create', NotificationController.createClientNotification)
