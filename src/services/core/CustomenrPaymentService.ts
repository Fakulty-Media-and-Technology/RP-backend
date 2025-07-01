import { ClientSession } from 'mongoose'
import { PaymentDetailModel } from '../../models/paymentDetails.model'
import { PaymentModel } from '../../models/payments.model'
import { PlanModel } from '../../models/plans.model'
import PaymentServices, { convertKoboToNaira } from '../../paymentIntegration'
import { PaymentDetailRepo } from '../../repositories/PaymentDetailRepo'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { SubscriptionModel } from '../../models/subscription.model'
import { WalletModel } from '../../models/wallet.model'
import { SubscriptionRepo } from '../../repositories/SubscriptionRepo'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { GiftCardModel } from '../../models/giftcard.model'

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

interface CreateSubInput {
  user: LoggedInUser
  data: Record<string, any>
}

interface TopUpWalletInput {
  user: LoggedInUser
  reference: string
}

interface RedeemGiftCardInput {
  user: LoggedInUser
  giftCode: string
}

export class CustomerPaymentService {
  static startPayment = async (_: LoggedInUser, __: StartPaymentInput) => {
    if (true) {
      throw new OperationalError('Service is under review', 504)
    }

    // const { email, amount } = data

    // const response = await PaymentServices.paystackStartPayment({
    //   email,
    //   amount,
    //   user_id: currentUser.id,
    //   full_name: `${currentUser.first_name} ${currentUser.last_name}`,
    // })

    // return response
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

  static authorizePayment = async (_: LoggedInUser, __: number) => {
    if (true) {
      throw new OperationalError('Service is under review', 504)
    }

    // const { id, first_name, last_name, email } = currentUser

    // const payAuth = await PaymentDetailRepo.findOneByUserId(id)

    // if (payAuth == null || payAuth.authorization_code == null) {
    //   throw new OperationalError('payAuth or payAuth authorization code does not exist', 404)
    // }

    // TODO: Use Session/transaction

    // const response = await PaymentServices.paystackAuthorizePayment({
    //   authorization_code: payAuth.authorization_code,
    //   email: email,
    //   amount: chargeAmount,
    //   user_id: id,
    //   full_name: `${first_name} ${last_name}`,
    // })

    // const { status, amount, metadata, customer, reference } = response.data

    // const newPayment = await PaymentModel.create({
    //   reference,
    //   status,
    //   email: customer.email,
    //   user_id: metadata.user_id,
    //   full_name: metadata.full_name,
    //   amount: convertKoboToNaira(amount),
    // })

    // // ? Why is new Payment sent when status is failed?
    // if (status !== 'success') {
    //   throw new OperationalError('authorize payment request unsuccessfull', 400, newPayment)
    // }

    // return newPayment
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

  // TODO: Modify to UI
  static getTransactionHistory = async (userId: string, query: ExpressRequestQuery) => {
    const dbQuery = PaymentModel.find({
      user_id: userId,
    })
      .select('-user_id -is_used -__v')
      .sort({ _id: -1 })

    const response = await new QueryParamsFeatures(dbQuery, {
      defaultLimit: 10,
      defaultPage: 1,
      queryParams: query,
    }).paginate().query

    return response
  }

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

      if (plan.price > cusWallet.balance) {
        throw new OperationalError('insufficient balance', 400)
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

  private static _topUpWalletSession = async (
    { user, reference }: TopUpWalletInput,
    session: MaybeSession,
  ) => {
    const paymentVerif = await PaymentModel.findOne({
      reference: reference,
      user_id: user._id,
      status: 'success',
      is_used: false,
    })

    if (!paymentVerif) {
      throw new OperationalError('something went wrong, payement not valid', 400)
    }

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
        session,
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
        session,
      },
    )
  }

  static topUpWallet = async (input: TopUpWalletInput) =>
    await withMongoDBSession(this._topUpWalletSession, input)

  static fetchWallet = async (user: LoggedInUser) => {
    const custBalance = await WalletModel.find({ user_id: user._id }).select('-__v')
    return custBalance
  }

  private static _redeemGiftCardSession = async (
    { user, giftCode }: RedeemGiftCardInput,
    session: MaybeSession,
  ) => {
    const giftCard = await GiftCardModel.findOne({
      code: giftCode,
    })

    if (!giftCard) {
      throw new OperationalError('invalid gift code entered', 404)
    }

    if (giftCard.used) {
      throw new OperationalError('Oops, voucher has been used', 400)
    }

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
        session,
      },
    )

    giftCard.used = true
    await giftCard.save({ session })
  }

  static redeemGiftCard = async (input: RedeemGiftCardInput) =>
    await withMongoDBSession(this._redeemGiftCardSession, input)
}
