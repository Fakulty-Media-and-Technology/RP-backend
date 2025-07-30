import { Router } from 'express'
import { ClientLiveStreamController } from '../../controllers/clients/livestream.clients'
import { ClientVoteController } from '../../controllers/clients/vote.clients'
import { requestValidator } from '../../middlewares/requestValidator'
import { Multer } from '../../utils/Multer'
import { createContestantSchema } from '../../validations/admin'

export const clientLiveRouter = Router()

clientLiveRouter.get('/streamkey', ClientLiveStreamController.getLiveStreamCredentials)
clientLiveRouter.post('/vote/info', ClientVoteController.createVoteInfo)
clientLiveRouter.put('/vote/info/update', ClientVoteController.updateVoteInfo)
clientLiveRouter.get('/vote/contestant/fetch', ClientVoteController.fetchVoteContestants)

clientLiveRouter.post(
  '/vote/contestant',
  Multer.uploadSingleImage,
  requestValidator(createContestantSchema),
  ClientVoteController.addVoteContestant,
)
clientLiveRouter.post('/vote/contestant/remove', ClientVoteController.rmVoteContestants)
clientLiveRouter.get('/vote/voting-status', ClientVoteController.votestatusInfo)
