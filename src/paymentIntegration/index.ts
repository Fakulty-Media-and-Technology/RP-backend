import { PaymentDetailModel } from '../models/paymentDetails.model'
import { PaymentModel } from '../models/payments.model'
import { AuthorizePaymentInput, IntitializePaymentInput, Paystack } from './paystack'

export const convertKoboToNaira = (kobo: number) => {
  const naira = kobo / 100
  return naira.toFixed(2)
}

export const PaymentIntegrationWrapper = {
  async paystackStartPayment(data: IntitializePaymentInput) {
    return await Paystack.initializePayment(data)
  },

  async paystackAuthorizePayment(data: AuthorizePaymentInput) {
    return await Paystack.authorizePayment(data)
  },

  async paystackCreatePayment(ref: string, save_card: boolean, uid: string) {
    const payment = await Paystack.verifyPayment(ref)

    const {
      amount,
      reference,
      status,
      authorization: { authorization_code, last4, brand, exp_month, exp_year, channel },
    } = payment

    // TODO: Use Session

    if (save_card && channel === 'card' && status === 'success') {
      await PaymentDetailModel.findOneAndUpdate(
        {
          user_id: uid,
        },
        {
          authorization_code,
          last4,
          exp_month,
          exp_year,
          brand,
        },
        {
          new: true,
          upsert: true,
        },
      )
    }

    const nairaAmount = convertKoboToNaira(amount)

    if (status !== 'success') {
      const newPayment = new PaymentModel({
        user_id: payment.metadata.user_id,
        full_name: payment.metadata.full_name,
        email: payment.customer.email,
        amount: nairaAmount,
        reference: reference,
        status: status,
      })

      const nPayment = await newPayment.save()

      return nPayment
    }

    const newPayment = new PaymentModel({
      user_id: payment.metadata.user_id,
      full_name: payment.metadata.full_name,
      email: payment.customer.email,
      amount: nairaAmount,
      reference: reference,
      status: status,
    })

    return await newPayment.save()
  },

  async paystackPaymentReciept({ reference }: { reference: string }) {
    // TODO: Move to repo layer
    const reciept = await PaymentModel.findOne({
      reference: reference,
    })

    return reciept
  },
}
