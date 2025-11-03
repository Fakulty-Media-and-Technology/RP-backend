import { Router } from 'express'
import { WebhooksController } from '../../controllers/webhooks'

export const webhooksRouter = Router()

webhooksRouter.post('/paystack', WebhooksController.paystack)
webhooksRouter.post('/flutterwave/v3', WebhooksController.flutterwaveV3)
