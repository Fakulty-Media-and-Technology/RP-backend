import { Router } from 'express'
import { AdminPayoutController } from '../../controllers/admins/payouts.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { updatePayOutReqStatusSchema } from '../../validations/admin'

export const superAdminPayoutsRouter = Router()

superAdminPayoutsRouter.get('/request/all', AdminPayoutController.payoutReqAll)
superAdminPayoutsRouter.get('/request/one/:id', AdminPayoutController.payoutReqOne)

superAdminPayoutsRouter.put(
  '/request/status/:id',
  requestValidator(updatePayOutReqStatusSchema),
  AdminPayoutController.payoutStatusUpdate,
)
// superAdminPayoutsRouter.get("/request/group", AdminPayoutController.payoutReqGroup);
