import { Router } from 'express'
import { SharedController } from '../../controllers/common/shared.controller'

export const router = Router()

//live events
router.get('/stream/:id', SharedController.streamLiveEvent)

router.get('/fetch/all', SharedController.getLiveEventsByType('all'))
router.get('/fetch/featured', SharedController.getLiveEventsByType('featured'))
router.get('/fetch/sponsored', SharedController.getLiveEventsByType('sponsored'))
router.get('/fetch/channels', SharedController.getLiveEventsByType('channels'))
router.get('/fetch/pop/channels', SharedController.getLiveEventsByType('channels popular'))
router.get('/fetch/events', SharedController.getLiveEventsByType('events'))
router.get('/fetch/pop/events', SharedController.getLiveEventsByType('events popular'))
router.get('/fetch/tvshows', SharedController.getLiveEventsByType('tvshows'))
router.get('/fetch/pop/tvshows', SharedController.getLiveEventsByType('tvshows popular'))
router.get('/fetch/sports', SharedController.getLiveEventsByType('sports'))
router.get('/fetch/pop/sports', SharedController.getLiveEventsByType('sports popular'))
router.get('/fetch/podcasts', SharedController.getLiveEventsByType('podcasts'))
router.get('/fetch/pop/podcasts', SharedController.getLiveEventsByType('podcasts popular'))
