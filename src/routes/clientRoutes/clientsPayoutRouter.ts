import { Router } from 'express'
import { ClientWithdrawalController } from '../../controllers/clients/withdrawal.clients'

export const clientPayoutRouter = Router()

// router.put('/payment/request/ed/:id', ClientWithdrawalController.reqPayoutEdit)
clientPayoutRouter.post('/payment/request', ClientWithdrawalController.reqPayout)
clientPayoutRouter.get('/payment/request/his', ClientWithdrawalController.payoutReqInfoAll)
clientPayoutRouter.get('/payment/request/group', ClientWithdrawalController.payoutReqInfoGroup)
