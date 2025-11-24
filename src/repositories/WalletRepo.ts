import { WalletModel, WalletSchema } from '../models/wallet.model'
import { StringOrObjectId } from '../types'
import { getWalletCurrencyKey, ValidCurrency } from '../utils/currency'
import { MaybeSession } from '../utils/mongoDbSessionRunner'

export type WalletCurrencyKey = keyof Pick<WalletSchema, 'NGNBalance' | 'USDBalance' | 'GMDBalance'>

interface UpdateBalanceInput {
  userId: StringOrObjectId
  topUpAmount: number
  currency: ValidCurrency
  session: MaybeSession
}

export class WalletRepo {
  static updateBalance = ({ userId, topUpAmount, currency, session }: UpdateBalanceInput) =>
    WalletModel.findOneAndUpdate(
      { userId },
      {
        $inc: { [getWalletCurrencyKey(currency)]: topUpAmount },
      },
      { upsert: true, session, new: true },
    )

  static totalBalance = () =>
    WalletModel.aggregate([
      {
        $match: {
          $expr: {
            $ne: ['$user_id', null],
          },
        },
      },
      {
        $group: {
          _id: null,
          total_balance: { $sum: '$balance' },
        },
      },
      {
        $project: {
          _id: 0,
          total_balance: 1,
        },
      },
    ])
}
