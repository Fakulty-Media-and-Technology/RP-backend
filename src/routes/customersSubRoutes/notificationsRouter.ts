import { Router } from 'express'
import { CustomerNotificationController } from '../../controllers/customers/notifications.customer'

export const router = Router()

router.get('/', CustomerNotificationController.getNotifications)
router.post('=:notification_id/click', CustomerNotificationController.handleNotificationClick)
