import { Paystack as Pk } from 'paystack-sdk'
import { OperationalError } from '../utils/OperationalError'
import env from '../env'
import { ValidCurrency } from '../utils/currency'

export interface IntitializePaymentInput {
  full_name: string
  user_id: string
  email: string
  amount: number
  currency: ValidCurrency
}

export interface AuthorizePaymentInput extends IntitializePaymentInput {
  authorization_code: string
}

const paystackClient = new Pk(env.PAYSTACK_SECRET_KEY)

export class Paystack {
  static async initializePayment(body: IntitializePaymentInput) {
    const response = await paystackClient.transaction.initialize({
      email: body.email,
      amount: (body.amount * 100).toString(),
      currency: body.currency,
      metadata: {
        full_name: body.full_name,
        user_id: body.user_id,
      },
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

    return response
  }
}

export default Paystack
