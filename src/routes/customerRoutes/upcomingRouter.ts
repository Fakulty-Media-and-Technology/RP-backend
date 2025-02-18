import { Router } from 'express'
import { CustomerUpcomingController } from '../../controllers/customers/upcoming.customer'

export const router = Router()

router.get('/events/fetch', CustomerUpcomingController.fetch)
router.get('/events/is-subscribed/:id', CustomerUpcomingController.isSubscribed)
router.put('/events/subscribe/:id', CustomerUpcomingController.subscription('subscribe'))
router.put('/events/unsubscribe/:id', CustomerUpcomingController.subscription('unsubscribe'))
