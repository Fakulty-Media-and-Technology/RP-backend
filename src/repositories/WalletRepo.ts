import { WalletModel, WalletSchema } from '../models/wallet.model'
import { StringOrObjectId } from '../types'
import { MaybeSession } from '../utils/mongoDbSessionRunner'

export type WalletCurrencyKey = keyof Pick<WalletSchema, 'NGNBalance' | 'USDBalance'>

interface UpdateBalanceInput {
  userId: StringOrObjectId
  topUpAmount: number
  currencyKey: WalletCurrencyKey
  session: MaybeSession
}

export class WalletRepo {
  static updateBalance = ({ userId, topUpAmount, currencyKey, session }: UpdateBalanceInput) =>
    WalletModel.findOneAndUpdate(
      { userId },
      {
        $inc: { [currencyKey]: topUpAmount },
      },
      { upsert: true, session },
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
