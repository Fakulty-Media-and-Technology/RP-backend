import { Router } from 'express'
import { AdminGiftCardController } from '../../controllers/admins/giftcard.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { createMerchantSchema } from '../../validations/merchants'

export const giftCardRouter = Router()

giftCardRouter.get('/many/:currency/:email/:password', AdminGiftCardController.getMerchantCards)
giftCardRouter.post('/notify/:code/:email/:password', AdminGiftCardController.merchantNotifyIsUsed)
giftCardRouter.post(
  '/create',
  requestValidator(createMerchantSchema),
  AdminGiftCardController.createMerchant,
)
