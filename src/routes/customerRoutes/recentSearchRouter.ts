import { Router } from 'express'
import { RecentSearchController } from '../../controllers/customers/recent.search.customer'
import { requestValidator } from '../../middlewares/requestValidator'
import { registerRecentSearchSchema } from '../../validations/customers'

export const RecentSearchRouter = Router()

RecentSearchRouter.post(
  '/register',
  requestValidator(registerRecentSearchSchema),
  RecentSearchController.register,
)

RecentSearchRouter.get('/fetch', RecentSearchController.fetchMany)
