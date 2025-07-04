import { Router } from 'express'
import { ClientWithdrawalController } from '../../controllers/clients/withdrawal.clients'

export const router = Router()

// router.put('/payment/request/ed/:id', ClientWithdrawalController.reqPayoutEdit)
router.post('/payment/request', ClientWithdrawalController.reqPayout)
router.get('/payment/request/his', ClientWithdrawalController.payoutReqInfoAll)
router.get('/payment/request/group', ClientWithdrawalController.payoutReqInfoGroup)
