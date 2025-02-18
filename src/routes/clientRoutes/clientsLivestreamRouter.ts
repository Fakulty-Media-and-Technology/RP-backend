import { Router } from 'express'
import { ClientLiveStreamController } from '../../controllers/clients/livestream.clients'
import { ClientVoteController } from '../../controllers/clients/vote.clients'

export const router = Router()

router.get('/streamkey', ClientLiveStreamController.getLiveStreamCredentials)
router.post('/vote/info', ClientVoteController.createVoteInfo)
router.put('/vote/info/update', ClientVoteController.updateVoteInfo)
router.get('/vote/contestant/fetch', ClientVoteController.fetchVoteContestants)
router.post('/vote/contestant', ClientVoteController.addVoteContestant)
router.post('/vote/contestant/remove', ClientVoteController.rmVoteContestants)
router.get('/vote/voting-status', ClientVoteController.votestatusInfo)
