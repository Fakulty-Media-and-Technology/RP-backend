import { Paystack as Pk } from 'paystack-sdk'
import { OperationalError } from '../utils/OperationalError'
import env from '../env'
import { ValidCurrency } from '../utils/currency'

interface CreateTransaferRecipiantInput {
  fullName: string
  bankType: string
  accountNumber: string
  bankCode: string
  currency: string
}

interface InitiateTransferInput extends CreateTransaferRecipiantInput {
  amount: number
  reference: string
}

export interface IntitializePaymentInput {
  email: string
  amount: number
  currency: ValidCurrency
  metadata?: Record<string, any>
  reference: string
}

export interface AuthorizePaymentInput extends Pick<IntitializePaymentInput, 'amount' | 'email'> {
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
      reference: details.reference,
    })

    if (response.data == null || !response.status) {
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
      throw new OperationalError(response.message, 400)
    }

    return response.data
  }

  static async verifyPayment(reference: string) {
    const response = await paystackClient.transaction.verify(reference)

    if (response.data == null || !response.status) {
      throw new OperationalError(response.message, 400)
    }

    return response.data
  }

  private static _createTransferRecipient = async ({
    bankCode,
    bankType,
    accountNumber,
    fullName,
    currency,
  }: CreateTransaferRecipiantInput) => {
    const response = await paystackClient.recipient.create({
      type: bankType,
      currency,
      bank_code: bankCode,
      account_number: accountNumber,
      name: fullName,
    })

    if (response.data === null || response.status === false) {
      throw new OperationalError(response.message, 400)
    }

    return response.data
  }

  static initiateTransfer = async ({
    reference,
    amount,
    ...createRecipiantInput
  }: InitiateTransferInput) => {
    const recepiantDetails = await this._createTransferRecipient(createRecipiantInput)

    const response = await paystackClient.transfer.initiate({
      source: 'balance',
      amount: amount * 100,
      reference,
      recipient: recepiantDetails.recipient_code,
    })

    if (response.status === false) {
      throw new OperationalError(response.message, 400)
    }

    return response
  }

  // static verifyTransfer = async (reference: string) => {
  //   const response = await paystackClient.transfer.verify(reference)

  //   type X = Extract<Awaited<ReturnType<typeof paystackClient.transfer.verify>>, 'VerifyTransfer'>

  //   const y = {} sat X

  //   y.

  //       if (response.data == null || !response.status) {
  //     throw new OperationalError(response.message, 400)
  //   }

  // }
}

export default Paystack
