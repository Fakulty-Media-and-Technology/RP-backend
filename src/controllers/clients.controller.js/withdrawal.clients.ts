import env from '../../env'
import { PayoutModel } from '../../models/payouts.model'
import { WalletModel } from '../../models/wallet.model'
import { LoggedInUser } from '../../types'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'

export class WithdrawalService {
  static requestPayout = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    const { amount, account_number, account_name, bank_name } = data

    if (!amount || !account_name || !account_name || !bank_name) {
      throw new OperationalError('all input are required', 400)
    }

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

    if (Number(amount) > accBal.balance) {
      throw new OperationalError('insufficient balance', 404)
    }

    //check minimum withdrawal

    const minimumWithdrawal = 50000

    if (Number(amount) < minimumWithdrawal) {
      throw new OperationalError('requested amount is below limit of 50000', 400)
    }

    //remove board charges
    const percent = 15 //todo, admin can always modify
    const finAmount = amount - (Number(amount) * Number(percent)) / 100

    await PayoutModel.create({
      client_id: currentUser._id,
      amount: finAmount,
      charges: (Number(amount) * Number(percent)) / 100,
      account_number,
      account_name,
      bank_name,
    })
  }

  static editPayout = async (
    currentUser: LoggedInUser,
    payoutId: string,
    data: Record<string, any>,
  ) => {
    const { amount, account_number, account_name, bank_name } = data

    const initVal = await PayoutModel.findOne({
      _id: payoutId,
      status: 'pending',
      client_id: currentUser._id,
    })

    if (!initVal) {
      throw new OperationalError(
        "payout request can no longer be modified, it's being processed",
        400,
      )
    }

    const accBal = await WalletModel.findOne({ user_id: currentUser._id })

    if (Number(amount) > Number(accBal?.balance)) {
      throw new OperationalError('insufficient balance', 400)
    }

    if (Number(amount) < env.MIN_WITHDRAWAL_AMOUNT) {
      throw new OperationalError(
        `requested amount is below limit of ${env.MIN_WITHDRAWAL_AMOUNT}`,
        400,
      )
    }

    const finAmount = amount - (Number(amount) * env.WITHDRAWAL_PERCENT) / 100

    await PayoutModel.findOneAndUpdate(
      {
        _id: payoutId,
        client_id: currentUser._id,
      },
      {
        amount: amount ? finAmount : initVal.amount,
        account_number: account_number ? account_number : initVal.account_number,
        account_name: account_name ? account_name : initVal.account_name,
        bank_name: bank_name ? account_name : initVal.bank_name,
      },
      {
        upsert: true,
      },
    )
  }
}

export class WithdrawalController {
  static reqPayout = Catch.async(async (req, res) => {
    await WithdrawalService.requestPayout(GetDefined.loggedInUser(req.user), req.body)

    sendResponse({
      res,
      message: 'payout request submitted',
    })
  })

  static reqPayoutEdit = Catch.async(async ({ user, params, body }, res) => {
    await WithdrawalService.editPayout(GetDefined.loggedInUser(req.user), params.id, body)

    sendResponse({
      res,
      message: 'Payout edited',
    })
  })

  static payoutReqInfoAll = Catch.async(async (req, res) => {
    try {
      const user = req.user

      const initVal = await PayoutsModel.aggregate([
        {
          $match: {
            $expr: {
              $eq: [
                '$client_id',
                {
                  $toObjectId: user._id,
                },
              ],
            },
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ])

      return successResponse(res, 200, initVal, 'payout requests all history')
    } catch (error) {
      return serverError(res, 400, null, error.message)
    }
  })

  static payoutReqInfoGroup = Catch.async(async (req, res) => {
    try {
      const user = req.user
      const initVal = await PayoutModel.aggregate([
        {
          $match: {
            $expr: {
              $eq: [
                '$client_id',
                {
                  $toObjectId: user._id,
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: '$status',
            group: { $push: '$$ROOT' },
          },
        },
      ])

      return successResponse(res, 200, initVal, 'payout requests all grouped')
    } catch (error) {
      return serverError(res, 400, null, error.message)
    }
  })
}
