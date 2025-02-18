import { Router } from 'express'
import { AdminPlanSubController } from '../../controllers/admins/plan-sub.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { createPlanSchema, updatePlanSchema } from '../../validations/admin'

export const superAdminSubscriptionRouter = Router()

superAdminSubscriptionRouter.get('/plans/fetch', AdminPlanSubController.fetchPlans)
superAdminSubscriptionRouter.get('/all/fetch', AdminPlanSubController.fetchSubscriptions)

superAdminSubscriptionRouter.delete('/plans/delete/:id', AdminPlanSubController.deletePlans)

superAdminSubscriptionRouter.post(
  '/plans/create',
  requestValidator(createPlanSchema),
  AdminPlanSubController.createPlan,
)

superAdminSubscriptionRouter.put(
  '/plans/update/:id',
  requestValidator(updatePlanSchema),
  AdminPlanSubController.updatePlan,
)

