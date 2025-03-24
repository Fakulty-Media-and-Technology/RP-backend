import { Router } from 'express'
import { CustomerSharedController } from '../../controllers/customers/medias.customer'

export const router = Router()

//live events
router.get('/stream/:id', CustomerSharedController.streamLiveEvent)

router.get('/fetch/all', CustomerSharedController.getLiveEventsByType('all'))
router.get('/fetch/featured', CustomerSharedController.getLiveEventsByType('featured'))
router.get('/fetch/sponsored', CustomerSharedController.getLiveEventsByType('sponsored'))
router.get('/fetch/channels', CustomerSharedController.getLiveEventsByType('channels'))
router.get('/fetch/pop/channels', CustomerSharedController.getLiveEventsByType('channels popular'))
router.get('/fetch/events', CustomerSharedController.getLiveEventsByType('events'))
router.get('/fetch/pop/events', CustomerSharedController.getLiveEventsByType('events popular'))
router.get('/fetch/tvshows', CustomerSharedController.getLiveEventsByType('tvshows'))
router.get('/fetch/pop/tvshows', CustomerSharedController.getLiveEventsByType('tvshows popular'))
router.get('/fetch/sports', CustomerSharedController.getLiveEventsByType('sports'))
router.get('/fetch/pop/sports', CustomerSharedController.getLiveEventsByType('sports popular'))
router.get('/fetch/podcasts', CustomerSharedController.getLiveEventsByType('podcasts'))
router.get('/fetch/pop/podcasts', CustomerSharedController.getLiveEventsByType('podcasts popular'))
