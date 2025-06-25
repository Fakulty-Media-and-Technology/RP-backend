import { Catch } from '../../utils/Catch'

export class WebhooksController {
  static paystack = Catch.async(async (req, res) => {
    const event = req.body

    console.log('event', event)

    res.sendStatus(200)
  })
}
