import { Paystack as Pk } from 'paystack-sdk'
import { OperationalError } from '../utils/OperationalError'
import env from '../env'

export interface IntitializePaymentInput {
  full_name: string
  user_id: string
  email: string
  amount: number
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
      metadata: {
        full_name: body.full_name,
        user_id: body.user_id,
      },
    })

    if (response.data == null || !response.status) {
      console.error(`Paystack Init Error: ${response.message}`)
      throw new OperationalError(response.message, 400)
    }

    return response

    // try {
    //   const metd = JSON.stringify({
    //     full_name: body.full_name,
    //     user_id: body.user_id,
    //   })

    //   const options = {
    //     method: 'POST',
    //     url: 'https://api.paystack.co/transaction/initialize',
    //     headers: {
    //       Authorization: `Bearer ${paySecretKey}`,
    //       'content-type': 'application/json',
    //       'cache-control': 'no-cache',
    //     },
    //     data: {
    //       email: body.email,
    //       amount: body.amount * 100,
    //       metadata: metd,
    //     },
    //   }

    //   const response = await axios.request(options)

    //   return response.data
    // } catch (error) {
    //   console.log(`Paystack Init Error: ${error}`)
    //   return error.message
    // }
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
