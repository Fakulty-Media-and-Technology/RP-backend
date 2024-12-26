import { PaymentDetailModel } from '../../models/paymentDetails.model'
import { PaymentModel } from '../../models/payments.model'
import PaymentServices, { convertKoboToNaira } from '../../paymentIntegration'
import { PaymentDetailRepo } from '../../repositories/PaymentDetailRepo'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'

interface StartPaymentInput {
  email: string
  amount: number
}

interface CreatePaymentInput {
  reference: string
  save_card: boolean
}

interface AddPaymentInput {
  authorization_code: string
  last4: string
  brand: string
}

export class CustomerPaymentService {
  static startPayment = async (currentUser: LoggedInUser, data: StartPaymentInput) => {
    const { email, amount } = data

    const response = await PaymentServices.paystackStartPayment({
      email,
      amount,
      user_id: currentUser.id,
      full_name: `${currentUser.first_name} ${currentUser.last_name}`,
    })

    return response
  }

  static addPayment = async (currentUser: LoggedInUser, data: Partial<AddPaymentInput>) => {
    const { authorization_code, last4, brand } = data

    if (!authorization_code || !last4 || !brand) {
      throw new OperationalError('all input are required', 400)
    }

    await PaymentDetailModel.findOneAndUpdate(
      {
        user_id: currentUser._id,
      },
      {
        authorization_code,
        last4,
        brand,
      },
      { new: true, upsert: true },
    )
  }

  static authorizePayment = async (currentUser: LoggedInUser, chargeAmount: number) => {
    const { id, first_name, last_name, email } = currentUser

    const payAuth = await PaymentDetailRepo.findOneByUserId(id)

    if (payAuth == null || payAuth.authorization_code == null) {
      throw new OperationalError('payAuth or payAuth authorization code does not exist', 404)
    }

    // TODO: Use Session/transaction

    const response = await PaymentServices.paystackAuthorizePayment({
      authorization_code: payAuth.authorization_code,
      email: email,
      amount: chargeAmount,
      user_id: id,
      full_name: `${first_name} ${last_name}`,
    })

    const { status, amount, metadata, customer, reference } = response.data

    const newPayment = await PaymentModel.create({
      reference,
      status,
      email: customer.email,
      user_id: metadata.user_id,
      full_name: metadata.full_name,
      amount: convertKoboToNaira(amount),
    })

    // ? Why is new Payment sent when status is failed?
    if (status !== 'success') {
      throw new OperationalError('authorize payment request unsuccessfull', 400, newPayment)
    }

    return newPayment
  }

  static createPayment = async (currentUser: LoggedInUser, data: CreatePaymentInput) => {
    const { reference, save_card } = data

    const payment = await PaymentModel.findOne({
      reference,
      status: 'success',
    })

    if (payment) {
      throw new OperationalError('payment reference already existed', 400)
    }

    const response = await PaymentServices.paystackCreatePayment(
      reference,
      save_card,
      currentUser.id,
    )

    return response
  }

  static getPaymentRecepit = async (reference: string) => {
    const response = await PaymentServices.paystackPaymentReciept({
      reference,
    })

    return response
  }

  static getTransactionHistory = async (currentUser: LoggedInUser) => {
    const response = await PaymentModel.find({
      user_id: currentUser._id,
    })
      .select('-user_id -is_used -__v')
      .sort({ createdAt: -1 })

    return response
  }
}
