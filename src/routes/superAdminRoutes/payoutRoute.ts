import { Router } from 'express'
import { AdminPayoutController } from '../../controllers/admins/payouts.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { updatePayOutReqStatusSchema } from '../../validations/admin'

export const superAdminPayoutsRouter = Router()

superAdminPayoutsRouter.get('/payouts/request/all', AdminPayoutController.payoutReqAll)
superAdminPayoutsRouter.get('/payouts/request/one/:id', AdminPayoutController.payoutReqOne)

superAdminPayoutsRouter.put(
  '/payouts/request/status/:id',
  requestValidator(updatePayOutReqStatusSchema),
  AdminPayoutController.payoutStatusUpdate,
)
// superAdminPayoutsRouter.get("/payouts/request/group", AdminPayoutController.payoutReqGroup);
