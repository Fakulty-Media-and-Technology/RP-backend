import { createHmac } from 'node:crypto'
import { WebhooksService } from '../../services/core/WebhooksService'
import { Catch } from '../../utils/Catch'
import env from '../../env'

export class WebhooksController {
  static paystack = Catch.async(async (req, res) => {
    const hash = createHmac('sha512', env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex')

    const payshackHash = req.headers['x-paystack-signature']

    if (hash == payshackHash) {
      WebhooksService.paystackEvent(req.body)
    }

    res.sendStatus(200)
  })

  static flutterwaveV3 = Catch.async(async (req, res) => {
    if (req.headers['verif-hash'] !== env.FLUTTERWAVE_SECRET_HASH) {
      console.error('🛑Invalid flutterwave signature.', req.headers)
      res.sendStatus(403)
      return
    }

    WebhooksService.flutterEvent(req.body)
    res.sendStatus(200)
  })
}
