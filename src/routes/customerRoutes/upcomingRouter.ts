import { Router } from 'express'
import { CustomerUpcomingController } from '../../controllers/customers/upcoming.customer'
import { requestValidator } from '../../middlewares/requestValidator'
import {
  fetchUpcomingSchema,
  isSubscribedSchema,
  subscriptionSchema,
} from '../../validations/customers'

export const router = Router()

router.get('/events/fetch', requestValidator(fetchUpcomingSchema), CustomerUpcomingController.fetch)

router.get(
  '/events/is-subscribed/:id/:contentType',
  requestValidator(isSubscribedSchema),
  CustomerUpcomingController.isSubscribed,
)

router.put(
  '/events/subscribe/:id/:contentType',
  requestValidator(subscriptionSchema),
  CustomerUpcomingController.subscription('subscribe'),
)
router.put(
  '/events/unsubscribe/:id/:contentType',
  requestValidator(subscriptionSchema),
  CustomerUpcomingController.subscription('unsubscribe'),
)
