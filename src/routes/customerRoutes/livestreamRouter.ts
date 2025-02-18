import { Router } from 'express'
import { CustomerVoteController } from '../../controllers/customers/vote.custumers'

export const router = Router()

router.post('/vote/create-vote', CustomerVoteController.createVote)
router.post('/donate/dash-fund', CustomerVoteController.donateFund)
router.get('/vote/fetch-info', CustomerVoteController.fetchVoteInfo)
router.get('/vote/fetch-contestants', CustomerVoteController.fetchVoteContestants)
