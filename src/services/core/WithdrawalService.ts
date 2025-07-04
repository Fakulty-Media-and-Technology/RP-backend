import env from '../../env'
import { PayoutModel, PayoutSchema } from '../../models/payouts.model'
import { WalletModel } from '../../models/wallet.model'
import Paystack from '../../paymentIntegration/paystack'
import { LoggedInUser } from '../../types'
import { PaystackTransferWebhooksData } from '../../types/webhooks'
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

interface HandleWebhookEventByReferenceInput {
  reference: string
  status: PayoutSchema['status']
}

export class WithdrawalService {
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
    const unresolvedPay = await PayoutModel.findOne({
      client_id: currentUser.id,
      status: { $in: ['pending', 'processing'] },
    })

    if (unresolvedPay !== null) {
      throw new OperationalError("you've already requested for an unresolved payout request", 400)
    }

    const accBal = await WalletModel.findOne({ user_id: currentUser._id })

    if (accBal === null) {
      throw new OperationalError('Account balance does not exist', 404)
    }

    if (amount < env.MIN_WITHDRAWAL_AMOUNT) {
      throw new OperationalError(
        'requested amount is below limit of ' + env.MIN_WITHDRAWAL_AMOUNT,
        400,
      )
    }

    if (
      (currency === 'NGN' && amount < accBal.NGNBalance) ||
      (currency === 'USD' && amount < accBal.USDBalance)
    ) {
      throw new OperationalError('insufficient funds', 400)
    }

    //remove board charges
    const percent = 15 //todo, admin can always modify
    const charges = this._calcPercentOff(amount, percent)
    const earnings = amount - charges

    const payout = await new PayoutModel({
      client_id: currentUser._id,
      amount: earnings,
      currency,
      charges,
      accountNumber,
      accountName,
      bankName,
    }).save({ session })

    await Paystack.initiateTransfer({
      payoutId: payout._id.toString(),
      amount: earnings,
      fullName: `${currentUser.first_name} ${currentUser.last_name}`,
      bankCode,
      accountNumber,
      currency,
      bankType,
    })
  }

  static requestPayout = async (params: RequestPayoutInput) => {
    await withMongoDBSession(this._reqPayoutTransaction, params)
  }

  // static editPayout = async (
  //   currentUser: LoggedInUser,
  //   payoutId: string,
  //   data: Record<string, any>,
  // ) => {
  //   const { amount, account_number, account_name, bank_name } = data

  //   const initVal = await PayoutModel.findOne({
  //     _id: payoutId,
  //     status: 'pending',
  //     client_id: currentUser._id,
  //   })

  //   if (!initVal) {
  //     throw new OperationalError(
  //       "payout request can no longer be modified, it's being processed",
  //       400,
  //     )
  //   }

  //   const accBal = await WalletModel.findOne({ user_id: currentUser._id })

  //   // if (Number(amount) > Number(accBal?.balance)) {
  //   //   throw new OperationalError('insufficient balance', 400)
  //   // }

  //   if (Number(amount) < env.MIN_WITHDRAWAL_AMOUNT) {
  //     throw new OperationalError(
  //       `requested amount is below limit of ${env.MIN_WITHDRAWAL_AMOUNT}`,
  //       400,
  //     )
  //   }

  //   const finAmount = amount - (Number(amount) * env.WITHDRAWAL_PERCENT) / 100

  //   await PayoutModel.findOneAndUpdate(
  //     {
  //       _id: payoutId,
  //       client_id: currentUser._id,
  //     },
  //     {
  //       amount: amount ? finAmount : initVal.amount,
  //       account_number: account_number ? account_number : initVal.account_number,
  //       account_name: account_name ? account_name : initVal.account_name,
  //       bank_name: bank_name ? account_name : initVal.bank_name,
  //     },
  //     {
  //       upsert: true,
  //     },
  //   )
  // }

  static requestAllPayoutInfo = async (currentUser: LoggedInUser, query: ExpressRequestQuery) => {
    const payouts = await new QueryParamsFeatures(PayoutModel.find({ client_id: currentUser.id }), {
      defaultLimit: 200,
      defaultPage: 0,
      queryParams: query,
    }).paginate().query

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

  static _handleWebhookEventByReferenceTransaction = async (
    { reference, status }: HandleWebhookEventByReferenceInput,
    session: MaybeSession,
  ) => {
    const payout = await PayoutModel.findByIdAndUpdate(reference, { $set: { status } }, { session })

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
        break

      case 'reversed':
        break

      default:
        break
    }
  }

  static handleWebhookEventByReference = async (params: HandleWebhookEventByReferenceInput) => {
    try {
      await withMongoDBSession(this._handleWebhookEventByReferenceTransaction, params)
    } catch (e: any) {
      console.error('WithdrawalService.handleWebhookEventByReference error', e.message || e)
    }
  }
}
