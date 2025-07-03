import { Paystack as Pk } from 'paystack-sdk'
import { OperationalError } from '../utils/OperationalError'
import env from '../env'
import { ValidCurrency } from '../utils/currency'

export interface IntitializePaymentInput {
  email: string
  amount: number
  currency: ValidCurrency
  metadata?: Record<string, any>
}

export interface AuthorizePaymentInput extends IntitializePaymentInput {
  authorization_code: string
}

const paystackClient = new Pk(env.PAYSTACK_SECRET_KEY)

export class Paystack {
  static async initializePayment(details: IntitializePaymentInput) {
    const response = await paystackClient.transaction.initialize({
      email: details.email,
      amount: (details.amount * 100).toString(),
      currency: details.currency,
      metadata: details.metadata ?? {},
    })

    if (response.data == null || !response.status) {
      console.error(`Paystack Init Error: ${response.message}`)
      throw new OperationalError(response.message, 400)
    }

    return response.data
  }

  static async authorizePayment(body: AuthorizePaymentInput) {
    const response = await paystackClient.transaction.chargeAuthorization({
      authorization_code: body.authorization_code,
      email: body.email,
      amount: (body.amount * 100).toString(),
    })

    if (response.data == null || !response.status) {
      console.error(`Paystack Charge Authorization Error: ${response.message}`)
      throw new OperationalError(response.message, 400)
    }

    return response
  }

  static async verifyPayment(reference: string) {
    const response = await paystackClient.transaction.verify(reference)

    if (response.data == null || !response.status) {
      console.error(`Paystack verification Error: ${response.message}`)
      throw new OperationalError(response.message, 400)
    }

    return response.data
  }
}

export default Paystack
