import { Router } from 'express'
import { CustomerPushNotificationController } from '../../controllers/customers/pushNotification.customer'

export const router = Router()

router.post('/device/register', CustomerPushNotificationController.registerDeviceToken)
router.post('/device/update', CustomerPushNotificationController.updateDeviceToken)
