import axios from 'axios'
import env from '../env'
import { ErrorUtils } from '../utils/ErrorUtils'

interface PayoutInput {
  amount: number
  payourRef: string
  phoneNumber: string
  userFullName: string
}

interface PaymentInput {
  amount: number
  paymentReference: string
  phoneNumber: string
}

export class WavePayment {
  // https://docs.wave.com/checkout#checkout-api
  static accept = async ({ amount, paymentReference, phoneNumber }: PaymentInput) => {
    try {
      const response = await axios.post(
        'https://api.wave.com/v1/checkout/sessions',
        {
          amount,
          currency: 'GMD',
          client_reference: paymentReference,
          restrict_payer_mobile: phoneNumber,
          error_url: 'https://example.com/error',
          success_url: 'https://example.com/success',
        },
        {
          headers: {
            Authorization: `Bearer ${env.WAVE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      )

      return response.data.wave_launch_url as string
    } catch (e) {
      ErrorUtils.transformAxiosResponseError(e)
    }
  }

  // https://docs.wave.com/payout#payout-api
  static payout = async ({ amount, payourRef, phoneNumber, userFullName }: PayoutInput) => {
    try {
      const response = await axios.post(
        'https://api.wave.com/v1/payout',
        {
          receive_amount: amount,
          currency: 'GMD',
          name: userFullName,
          client_reference: payourRef,
          mobile: phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${env.WAVE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      )

      return response.data.wave_launch_url as string
    } catch (e) {
      ErrorUtils.transformAxiosResponseError(e)
    }
  }
}
