import { Router } from 'express'
import { CustomerSharedController } from '../../controllers/customers/medias.customer'

export const router = Router()

//live events
router.get('/events/fetch/all', CustomerSharedController.getLiveEventsByType('all'))
router.get('/events/fetch/featured', CustomerSharedController.getLiveEventsByType('featured'))
router.get('/events/fetch/sponsored', CustomerSharedController.getLiveEventsByType('sponsored'))
router.get('/events/fetch/channels', CustomerSharedController.getLiveEventsByType('channels'))
router.get(
  '/events/fetch/pop/channels',
  CustomerSharedController.getLiveEventsByType('channels popular'),
)

router.get('/events/fetch/events', CustomerSharedController.getLiveEventsByType('events'))
router.get(
  '/events/fetch/pop/events',
  CustomerSharedController.getLiveEventsByType('events popular'),
)

router.get('/events/fetch/tvshows', CustomerSharedController.getLiveEventsByType('tvshows'))

router.get(
  '/events/fetch/pop/tvshows',
  CustomerSharedController.getLiveEventsByType('tvshows popular'),
)

router.get('/events/fetch/sports', CustomerSharedController.getLiveEventsByType('sports'))

router.get(
  '/events/fetch/pop/sports',
  CustomerSharedController.getLiveEventsByType('sports popular'),
)

router.get('/events/fetch/podcasts', CustomerSharedController.getLiveEventsByType('podcasts'))

router.get(
  '/events/fetch/pop/podcasts',
  CustomerSharedController.getLiveEventsByType('podcasts popular'),
)

router.get('/event/stream/:id', CustomerSharedController.streamLiveEvent)
