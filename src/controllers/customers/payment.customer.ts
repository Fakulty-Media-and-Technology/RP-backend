import { GiftCardModel } from '../../models/giftcard.model'
import { PaymentModel } from '../../models/payments.model'
import { PlanModel } from '../../models/plans.model'
import { SubscriptionModel } from '../../models/subscription.model'
import { WalletModel } from '../../models/wallet.model'
import { SubscriptionRepo } from '../../repositories/SubscriptionRepo'
import { CustomerPaymentService } from '../../services/core/CustomenrPaymentService'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'

/**
 * This file is currently partially split to a service layer
 * The process of splitting is time consuming while the bugs are still not fixed.
 * As such, splitting operations will have to wait until the entire app is converted to ts files and all bugs have been fixed.
 * Author: Desmond Odion <d_clipse@icloud.com>
 * Date: 12/16/2024
 */

export class CustomerPaymentController {
  static startPayment = Catch.async(async ({ user, body }, res) => {
    sendResponse({
      res,
      data: await CustomerPaymentService.startPayment(GetDefined.loggedInUser(user), body),
      message: 'payment initiated',
    })
  })

  static authorizePayment = Catch.async(async ({ user, body: { amount_charge } }, res) => {
    sendResponse({
      res,
      message: 'payment authorization successfull',
      data: await CustomerPaymentService.authorizePayment(
        GetDefined.loggedInUser(user),
        amount_charge,
      ),
    })
  })

  static createPayment = Catch.async(async ({ user, body }, res) => {
    sendResponse({
      res,
      message: 'payment created and authorization activated',
      data: await CustomerPaymentService.createPayment(GetDefined.loggedInUser(user), body),
    })
  })

  static getPaymentReceipt = Catch.async(async (req, res) => {
    const { reference } = req.query

    if (typeof reference !== 'string') {
      throw new OperationalError('required query.reference must be a string', 400)
    }

    sendResponse({
      res,
      data: await CustomerPaymentService.getPaymentRecepit(reference),
      message: 'Payment initiated',
    })
  })

  static transactionHistory = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await CustomerPaymentService.getTransactionHistory(GetDefined.loggedInUser(req.user)),
      message: 'transaction history fetched',
    })
  })

  static addPayment = Catch.async(async ({ user, body }, res) => {
    await CustomerPaymentService.addPayment(GetDefined.loggedInUser(user), body)

    sendResponse({
      res,
      message: 'Payment added successfully',
    })
  })

  static fetchPlans = Catch.async(async (_, res) => {
    const plans = await PlanModel.find({
      months_duration: { $gt: 0 },
    }).select('-__v')

    sendResponse({
      res,
      data: plans,
      message: 'Plans Fetched',
    })
  })

  static createSubscription = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    const { source, plan_id, reference } = req.body

    if (source !== 'wallet' && source !== 'payment') {
      throw new OperationalError('subscription source must be specified: wallet/payment', 400)
    }

    const checkSub = await SubscriptionRepo.findOneActiveUserSub(user.id)

    if (checkSub) {
      throw new OperationalError('you still have an active subscription', 400)
    }

    const plan = await PlanModel.findOne({
      _id: plan_id,
    })

    if (plan == null) {
      throw new OperationalError('paln not found for user', 404)
    }

    if (source === 'wallet') {
      const cusWallet = await WalletModel.findOne({
        user_id: user._id,
      })

      if (cusWallet == null) {
        throw new OperationalError('wallet not found for user', 404)
      }

      if (plan.price > cusWallet.balance) {
        throw new OperationalError('insufficient balance', 400)
      }

      // TODO: Use session
      await new SubscriptionModel({
        user_id: user._id,
        plan_id: plan_id,
        start_date: new Date(),
        expiry_date: plan.getFutureDate(),
        payment_method: 'wallet',
        amount: Number(plan.price),
      }).save()

      await WalletModel.findOneAndUpdate(
        {
          _id: cusWallet._id,
          user_id: user._id,
        },
        {
          $inc: {
            balance: -Number(plan.price),
          },
        },
        {
          upsert: true,
        },
      )

      sendResponse({
        res,
        message: 'subscription created successfully from wallet',
      })

      return
    }

    const payDet = await PaymentModel.findOne({
      reference: reference,
      user_id: user._id,
      status: 'success',
      is_used: false,
    })

    if (payDet === null) {
      throw new OperationalError('something went wrong: payment unsuccessful or used by you', 400)
    }

    if (payDet.amount !== plan.price) {
      throw new OperationalError('amount paid and subscription plan price does not match', 400)
    }

    // TODO: Use Session

    await new SubscriptionModel({
      user_id: user._id,
      plan_id: plan_id,
      start_date: new Date(),
      expiry_date: plan.getFutureDate(),
      payment_method: 'direct-payment',
      amount: Number(plan.price),
    }).save()

    await PaymentModel.findOneAndUpdate(
      {
        _id: payDet._id,
        reference: reference,
      },
      {
        is_used: true,
      },
      {
        upsert: true,
      },
    )

    sendResponse({
      res,
      message: 'subscription created successfully by direct payment',
    })
  })

  static userSubStatus = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)

    const checkSub = await SubscriptionRepo.findOneActiveUserSub(user.id).sort({ _id: -1 })

    if (checkSub == null) {
      throw new OperationalError('you do not have any active subscription', 400)
    }

    sendResponse({
      res,
      data: checkSub,
      message: 'subscription status fetched',
    })
  })

  static topupWallet = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)

    const { reference } = req.body

    const paymentVerif = await PaymentModel.findOne({
      reference: reference,
      user_id: user._id,
      status: 'success',
      is_used: false,
    })

    if (!paymentVerif) {
      throw new OperationalError('something went wrong, payement not valid', 400)
    }

    // TODO: use session
    await WalletModel.findOneAndUpdate(
      {
        user_id: user._id,
      },
      {
        $inc: {
          balance: paymentVerif.amount,
        },
      },
      {
        upsert: true,
        new: true,
      },
    )

    await PaymentModel.findOneAndUpdate(
      {
        _id: paymentVerif._id,
      },
      {
        is_used: true,
        use_case: 'topup',
      },
      {
        upsert: true,
      },
    )

    sendResponse({
      res,
      message: 'top uo successful',
    })
  })

  static fetchWallet = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    const custBalance = await WalletModel.find({ user_id: user._id }).select('-__v')

    sendResponse({
      res,
      data: custBalance,
      message: 'user allet info',
    })
  })

  static redeemGiftCard = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)

    const { gift_code } = req.query

    const giftCard = await GiftCardModel.findOne({
      code: gift_code,
    })

    if (!giftCard) {
      throw new OperationalError('invalid gift code entered', 404)
    }

    if (giftCard.used) {
      throw new OperationalError('Oops, voucher has been used', 400)
    }

    // TODO: Use session

    await WalletModel.findOneAndUpdate(
      {
        user_id: user._id,
      },
      {
        $inc: {
          balance: giftCard.amount,
        },
      },
      {
        upsert: true,
      },
    )

    giftCard.used = true
    await giftCard.save()

    sendResponse({
      res,
      message: 'giftcard has been redeemed and credited to your wallet successfully',
    })
  })
}
