import { Router } from 'express'
import { CustomerSettingsController } from '../../controllers/customers/settings.customer'

export const router = Router()

router.put('/notification-vidquality', CustomerSettingsController.notificationSettings)
router.post('/watchlist/add', CustomerSettingsController.addToWatchList)
router.post('/watchlist/rem', CustomerSettingsController.remFromWatchList)
router.post('/interest/add', CustomerSettingsController.addToInterest)
