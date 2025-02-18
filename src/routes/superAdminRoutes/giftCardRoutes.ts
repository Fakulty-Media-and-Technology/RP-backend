import { Router } from 'express'
import { AdminGiftCardController } from '../../controllers/admins/giftcard.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { createGiftCardSchema } from '../../validations/admin'

export const superAdminGiftCardRouter = Router()

superAdminGiftCardRouter.post(
  '/generate/new',
  requestValidator(createGiftCardSchema),
  AdminGiftCardController.createGiftCard,
)

superAdminGiftCardRouter.get('/generated/fetch', AdminGiftCardController.fetchGiftCards)
