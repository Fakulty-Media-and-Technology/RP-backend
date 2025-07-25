import env from '../../env'
import { PayoutDocument, PayoutModel, PayoutSchema } from '../../models/payouts.model'
import { WalletModel } from '../../models/wallet.model'
import Paystack from '../../paymentIntegration/paystack'
import { WalletRepo } from '../../repositories/WalletRepo'
import { LoggedInUser } from '../../types'
import { ValidCurrency } from '../../utils/currency'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'

interface RequestPayoutInput {
  amount: number
  accountNumber: string
  accountName: string
  bankName: string
  bankCode: string
  bankType: string
  currency: ValidCurrency
  currentUser: LoggedInUser
}

interface HandleWebhookOperationsInput {
  reference: string
  status: PayoutSchema['status']
}

export class PayoutService {
  protected static _calcPercentOff = (amount: number, percent: number) => (amount * percent) / 100

  protected static _reqPayoutTransaction = async (
    {
      currentUser,
      amount,
      accountName,
      accountNumber,
      bankName,
      currency,
      bankCode,
      bankType,
    }: RequestPayoutInput,
    session: MaybeSession,
  ) => {
    if (currency === 'NGN' && amount < env.MIN_WITHDRAWAL_AMOUNT_NGN) {
      throw new OperationalError(
        'requested amount is below limit of ' + env.MIN_WITHDRAWAL_AMOUNT_NGN,
        400,
      )
    }

    if (currency === 'USD' && amount < env.MIN_WITHDRAWAL_AMOUNT_USD) {
      throw new OperationalError(
        'requested amount is below limit of ' + env.MIN_WITHDRAWAL_AMOUNT_USD,
        400,
      )
    }

    const wallet = await WalletModel.findOne({ userId: currentUser._id })

    if (wallet == null) {
      throw new OperationalError('Wallet does not exist', 404)
    }

    if (
      (currency === 'NGN' && amount > wallet.NGNBalance) ||
      (currency === 'USD' && amount > wallet.USDBalance)
    ) {
      throw new OperationalError('insufficient funds', 400)
    }

    const charges = this._calcPercentOff(amount, env.PAYOUT_SERVICE_CHARGE)
    const earnings = amount - charges

    const payout = new PayoutModel({
      client_id: currentUser._id,
      amount: earnings,
      currency,
      charges,
      accountNumber,
      accountName,
      bankName,
    })

    switch (currency) {
      case 'NGN':
        wallet.NGNBalance = wallet.NGNBalance - amount
        break
      case 'USD':
        wallet.USDBalance = wallet.USDBalance - amount
        break
      default:
        break
    }

    await Paystack.initiateTransfer({
      reference: payout._id.toString(),
      amount: earnings,
      fullName: `${currentUser.first_name} ${currentUser.last_name}`,
      bankCode,
      accountNumber,
      currency,
      bankType,
    })

    await payout.save({ session })
    await wallet.save({ session })
  }

  static requestPayout = async (params: RequestPayoutInput) => {
    await withMongoDBSession(this._reqPayoutTransaction, params)
  }

  static requestAllPayoutInfo = async (currentUser: LoggedInUser, query: ExpressRequestQuery) => {
    const payouts = await new QueryParamsFeatures(
      PayoutModel.find({ client_id: currentUser.id }).sort({ _id: -1 }),
      {
        defaultLimit: 200,
        defaultPage: 0,
        queryParams: query,
      },
    ).paginate().query

    return payouts
  }

  static requestPayoutInfoGroups = async (currentUser: LoggedInUser) => {
    return await PayoutModel.aggregate([
      {
        $match: {
          client_id: currentUser._id,
        },
      },
      {
        $group: {
          _id: '$status',
          group: { $push: '$$ROOT' },
        },
      },
    ])
  }

  protected static _refundWallet = async (payout: PayoutDocument, session: MaybeSession) => {
    await WalletRepo.updateBalance({
      userId: payout.client_id,
      topUpAmount: payout.amount + payout.charges,
      currency: payout.currency,
      session,
    })
  }

  static _handleWebhookOperationsTransaction = async (
    { reference, status }: HandleWebhookOperationsInput,
    session: MaybeSession,
  ) => {
    const payout = await PayoutModel.findByIdAndUpdate(reference, { $set: { status } }, { session })

    console.log('Payout handler called')

    console.dir({ reference, status, payout }, { depth: null })

    if (payout == null) {
      throw new OperationalError('invalid reference: ' + reference, 404)
    }

    // predicate for side effects
    switch (status) {
      case 'completed':
        break

      case 'pending':
        break

      case 'processing':
        break

      case 'rejected':
        await this._refundWallet(payout, session)
        break

      case 'reversed':
        await this._refundWallet(payout, session)
        break

      default:
        throw new OperationalError(`UNKOWNK PAYOUT STATUS: ${status}`, 400)
    }
  }

  static handleWebhookOperations = async (params: HandleWebhookOperationsInput) => {
    try {
      await withMongoDBSession(this._handleWebhookOperationsTransaction, params)
    } catch (e: any) {
      console.error('PayoutService.handleWebhookOperations error', e.message || e)
    }
  }
}
