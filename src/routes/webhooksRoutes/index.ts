import { Router } from 'express'
import { WebhooksController } from '../../controllers/webhooks'
import { RTMPWebhooksController } from '../../controllers/webhooks/rtmp.webhook.controller'

export const webhooksRouter = Router()

webhooksRouter.post('/paystack', WebhooksController.paystack)
webhooksRouter.post('/flutterwave/v3', WebhooksController.flutterwaveV3)
webhooksRouter.post('/wave', WebhooksController.wavePayment)

// RTMP/nginx-rtmp callbacks
webhooksRouter.post('/rtmp/on_publish_done', RTMPWebhooksController.onPublishDone)
webhooksRouter.post('/rtmp/on_play', RTMPWebhooksController.onPlay)
