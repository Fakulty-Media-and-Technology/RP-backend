import { createHmac } from 'node:crypto'
import { WebhooksService } from '../../services/core/WebhooksService'
import { Catch } from '../../utils/Catch'
import env from '../../env'

export class WebhooksController {
  static paystack = Catch.async(async (req, res) => {
    console.log('Webhook was called at', new Date())
    console.dir({ payload: req.body }, { depth: null })

    const hash = createHmac('sha512', env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex')

    const payshackHash = req.headers['x-paystack-signature']

    console.log({
      hash,
      payshackHash,
      get isSame() {
        return this.hash == this.payshackHash
      },
    })

    if (hash == payshackHash) {
      WebhooksService.delegateHandler(req.body)
    }

    res.sendStatus(200)
  })
}
