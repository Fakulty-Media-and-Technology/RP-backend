import { Router } from 'express'
import { AdminGiftCardController } from '../../controllers/admins/giftcard.admin'

export const giftCardRouter = Router()

giftCardRouter.get('/many/:currency/:email', AdminGiftCardController.getMerchantCards)
giftCardRouter.post('/notify/:code/:email', AdminGiftCardController.merchantNotifyIsUsed)
