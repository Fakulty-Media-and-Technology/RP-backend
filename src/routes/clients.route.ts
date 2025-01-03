import express from 'express'

import { ClientProfileController } from '../controllers/clients/profile.clients'
import { ClientLiveStreamController } from '../controllers/clients/livestream.clients'
import { ClientVoteController } from '../controllers/clients/vote.clients'
import { ClientWithdrawalController } from '../controllers/clients/withdrawal.clients'
import { CustomerPaymentController } from '../controllers/customers/payment.customer'
import { AuthMiddleware } from '../middlewares/auth'

import { requestValidator } from '../middlewares/requestValidator'
import { updateProfileSchema } from '../validations/client'

export const clientsRouter = express.Router()

clientsRouter.use(AuthMiddleware.authenticateRequest('clients-auth'))

clientsRouter.get('/profile/fetch', ClientProfileController.clientProfileFetch)
clientsRouter.get('/history/payment/fetch', ClientProfileController.clientsPaymentHis)

clientsRouter.put(
  '/profile/edit',
  requestValidator(updateProfileSchema),
  ClientProfileController.clientEditProfile,
)

clientsRouter.get('/livestream/streamkey', ClientLiveStreamController.getLiveStreamCredentials)
// clientsRouter.put("/livestream/preview-vid/:live_id", postPreviewVid);

clientsRouter.post('/livestream/vote/info', ClientVoteController.createVoteInfo)
clientsRouter.put('/livestream/vote/info/update', ClientVoteController.updateVoteInfo)
clientsRouter.get('/livestream/vote/contestant/fetch', ClientVoteController.fetchVoteContestants)
clientsRouter.post('/livestream/vote/contestant', ClientVoteController.addVoteContestant)
clientsRouter.post('/livestream/vote/contestant/remove', ClientVoteController.rmVoteContestants)
clientsRouter.get('/livestream/vote/voting-status', ClientVoteController.votestatusInfo)

clientsRouter.post('/payouts/payment/request', ClientWithdrawalController.reqPayout)
clientsRouter.put('/payouts/payment/request/ed/:id', ClientWithdrawalController.reqPayoutEdit)
clientsRouter.get('/payouts/payment/request/his', ClientWithdrawalController.payoutReqInfoAll)
clientsRouter.get('/payouts/payment/request/group', ClientWithdrawalController.payoutReqInfoGroup)

clientsRouter.post('/payment/paystack/init', CustomerPaymentController.startPayment)
clientsRouter.post('/event/create/payment', CustomerPaymentController.createPayment)
clientsRouter.get('/event/payment/estimate', ClientLiveStreamController.calculateEventCharges)
clientsRouter.post('/event/live/schedule', ClientLiveStreamController.createLiveClient)
clientsRouter.post('/event/live/extend', ClientLiveStreamController.extendLiveEvent)
