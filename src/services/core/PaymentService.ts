import { PaymentModel, PaymentUseCase } from '../../models/payments.model'
import Paystack from '../../paymentIntegration/paystack'
import { LoggedInUser } from '../../types'
import { ValidCurrency } from '../../utils/currency'

interface InitiatePaymentInput {
  amount: number
  currency: ValidCurrency
  currentUser: LoggedInUser
  fullName?: string
  email?: string
  useCase: PaymentUseCase
}

export class PaymentService {
  static initiatePayment = async ({
    currency,
    currentUser,
    email,
    amount,
    useCase,
    fullName,
  }: InitiatePaymentInput) => {
    const payment = new PaymentModel({
      user_id: currentUser._id,
      currency,
      full_name: fullName ?? `${currentUser.first_name} ${currentUser.last_name}`,
      email: email ?? currentUser.email,
      amount,
      use_case: useCase,
      status: 'success', // TODO: change to pending after webhooks setup
      is_used: false,
    })

    const initPayResponseData = await Paystack.initializePayment({
      full_name: payment.full_name,
      user_id: currentUser._id.toString(),
      email: payment.email,
      currency,
      amount,
    })

    payment.reference = initPayResponseData.reference
    await payment.save()

    const response = {
      ...initPayResponseData,
      paymentId: payment._id,
    }

    return response
  }
}
