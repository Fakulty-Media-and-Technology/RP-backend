import { Router } from 'express'
import { CustomerMediaController } from '../../controllers/customers/medias.customer'

export const router = Router()

//live events
router.get('/events/fetch/all', CustomerMediaController.getLiveEventsByType('all'))
router.get('/events/fetch/featured', CustomerMediaController.getLiveEventsByType('featured'))
router.get('/events/fetch/sponsored', CustomerMediaController.getLiveEventsByType('sponsored'))
router.get('/events/fetch/channels', CustomerMediaController.getLiveEventsByType('channels'))
router.get(
  '/events/fetch/pop/channels',
  CustomerMediaController.getLiveEventsByType('channels popular'),
)

router.get('/events/fetch/events', CustomerMediaController.getLiveEventsByType('events'))
router.get(
  '/events/fetch/pop/events',
  CustomerMediaController.getLiveEventsByType('events popular'),
)

router.get('/events/fetch/tvshows', CustomerMediaController.getLiveEventsByType('tvshows'))

router.get(
  '/events/fetch/pop/tvshows',
  CustomerMediaController.getLiveEventsByType('tvshows popular'),
)

router.get('/events/fetch/sports', CustomerMediaController.getLiveEventsByType('sports'))

router.get(
  '/events/fetch/pop/sports',
  CustomerMediaController.getLiveEventsByType('sports popular'),
)

router.get('/events/fetch/podcasts', CustomerMediaController.getLiveEventsByType('podcasts'))

router.get(
  '/events/fetch/pop/podcasts',
  CustomerMediaController.getLiveEventsByType('podcasts popular'),
)

router.get('/event/stream/:id', CustomerMediaController.streamLiveEvent)
