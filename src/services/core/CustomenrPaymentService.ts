import { PaymentModel } from '../../models/payments.model'
import { PlanModel } from '../../models/plans.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { SubscriptionModel } from '../../models/subscription.model'
import { WalletModel } from '../../models/wallet.model'
import { SubscriptionRepo } from '../../repositories/SubscriptionRepo'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { GiftCardModel } from '../../models/giftcard.model'

interface CreateSubInput {
  user: LoggedInUser
  data: Record<string, any>
}

export class CustomerPaymentService {
  static fetchPlans = async (query: ExpressRequestQuery) => {
    const plansQuery = PlanModel.find({
      months_duration: { $gt: 0 },
    }).select('-__v')

    const qFeatures = new QueryParamsFeatures(plansQuery, {
      defaultLimit: 50,
      defaultPage: 1,
      queryParams: query,
    })

    return await qFeatures.paginate().query
  }

  private static _createSubSession = async (
    { user, data }: CreateSubInput,
    session: MaybeSession,
  ) => {
    const { source, plan_id, reference } = data

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

      await new SubscriptionModel({
        user_id: user._id,
        plan_id: plan_id,
        start_date: new Date(),
        expiry_date: plan.getFutureDate(),
        payment_method: 'wallet',
        amount: Number(plan.price),
      }).save({ session })

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
          session,
        },
      )

      return 'subscription created successfully from wallet'
    }

    const payDet = await PaymentModel.findOne({
      reference,
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

    await new SubscriptionModel({
      user_id: user._id,
      plan_id: plan_id,
      start_date: new Date(),
      expiry_date: plan.getFutureDate(),
      payment_method: 'direct-payment',
      amount: Number(plan.price),
    }).save({ session })

    await PaymentModel.findOneAndUpdate(
      {
        _id: payDet._id,
        reference,
      },
      {
        is_used: true,
      },
      {
        upsert: true,
        session,
      },
    )

    return 'subscription created successfully by direct payment'
  }

  static createSub = async (input: CreateSubInput) =>
    await withMongoDBSession(this._createSubSession, input)

  static fetchSubStatus = async (user: LoggedInUser) => {
    const checkSub = await SubscriptionRepo.findOneActiveUserSub(user.id).sort({ _id: -1 })

    if (checkSub == null) {
      throw new OperationalError('you do not have any active subscription', 400)
    }

    return checkSub
  }
}
