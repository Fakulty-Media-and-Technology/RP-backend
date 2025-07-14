import env from '../../env'
import { ContestantsModel } from '../../models/contestants.model'
import { DonateModel } from '../../models/donate.model'
import { Live, LiveModel } from '../../models/lives.model'
import { PaymentDetailModel } from '../../models/paymentDetails.model'

import {
  PaymentDocument,
  PaymentModel,
  PaymentSchema,
  PaymentUseCase,
} from '../../models/payments.model'

import { UserModel } from '../../models/users.model'
import { VideoModel } from '../../models/videos.model'
import { VoteInfoModel } from '../../models/voteInfo.model'
import { VoteModel } from '../../models/votes.model'
import { WalletDocument, WalletModel } from '../../models/wallet.model'
import Paystack from '../../paymentIntegration/paystack'
import { PaymentRepo } from '../../repositories/PaymentRepo'
import { WalletRepo } from '../../repositories/WalletRepo'
import { LoggedInUser, StringOrObjectId } from '../../types'
import { CalcUtils } from '../../utils/Calc'
import { ValidCurrency } from '../../utils/currency'
import { addHours } from '../../utils/date'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'

type PaystackTransaction = Awaited<ReturnType<typeof Paystack.verifyPayment>>
type PaymentStatus = PaymentSchema['status']
type PaymentMethod = PaymentSchema['method']
type UserRole = LoggedInUser['role']

/**Includes dynamic Parameters depending on payment useCase */
interface InitiatePaymentInput {
  amount: number
  currency: ValidCurrency
  currentUser: LoggedInUser
  useCase: PaymentUseCase
  method: PaymentMethod

  fullName?: string
  email?: string
  liveId?: string
  videoId?: string
  voteInfoId?: string
  contestantId?: string
}

interface PostPaymentActionsInput {
  transaction: PaystackTransaction
  payment: PaymentDocument
  session: MaybeSession
}

interface AssingLivePaymentUserIdInput {
  currentUserRole: UserRole
  email?: string
  useCase: Extract<PaymentUseCase, 'live schedule' | 'live schedule ext'>
  payment: PaymentDocument
}

interface RegisterWithLiveByLiveIdInput {
  liveId?: string
  payment: PaymentDocument
  session: MaybeSession
  useCase: Extract<PaymentUseCase, 'live schedule ext'>
}

interface PrePaymentOperationsInput
  extends Pick<
    InitiatePaymentInput,
    'contestantId' | 'voteInfoId' | 'useCase' | 'email' | 'liveId'
  > {
  currentUserRole: LoggedInUser['role']
  currentUserId: StringOrObjectId
  payment: PaymentDocument
  session: MaybeSession
}

interface HandleGatewayPaymentInput
  extends Pick<InitiatePaymentInput, 'contestantId' | 'voteInfoId' | 'liveId'> {
  currentUser: LoggedInUser
  payment: PaymentDocument
  session: MaybeSession
}

interface HandleWalletPaymentInput {
  session: MaybeSession
  payment: PaymentDocument
  currentUser: LoggedInUser
  liveId: InitiatePaymentInput['liveId']
  videoId: InitiatePaymentInput['videoId']
}

type ProcessVoteInput = Pick<InitiatePaymentInput, 'voteInfoId' | 'contestantId'> &
  Pick<PrePaymentOperationsInput, 'currentUserId' | 'payment' | 'session'>

type PostPaymentUsecaseHandlerInput = Pick<PostPaymentActionsInput, 'session' | 'payment'>

type GetStatusFromTransaction = (t: PaystackTransaction) => PaymentStatus

export class PaymentService {
  protected static _fetchVotePredicateDocumentsWithSharedLiveId = async ({
    voteInfoId,
    contestantId,
  }: Required<Pick<InitiatePaymentInput, 'voteInfoId' | 'contestantId'>>) => {
    const [voteInfoResult, contestantResult] = await Promise.allSettled([
      VoteInfoModel.findById(voteInfoId),
      ContestantsModel.findById(contestantId),
    ])

    if (voteInfoResult.status === 'rejected') {
      throw voteInfoResult.reason
    }

    if (contestantResult.status === 'rejected') {
      throw contestantResult.reason
    }

    const voteInfoDocument = voteInfoResult.value
    const contestantDocument = contestantResult.value

    if (voteInfoDocument == null) {
      throw new OperationalError('invalid voteinfoId', 404)
    }

    if (contestantDocument == null) {
      throw new OperationalError('invalid contestantId', 404)
    }

    if (contestantDocument.liveId.toString() !== voteInfoDocument.liveId.toString()) {
      throw new OperationalError('live Id mismatch', 403)
    }

    return { contestantDocument, voteInfoDocument }
  }

  protected static _registerVote = async ({
    voteInfoId,
    contestantId,
    session,
    payment,
    currentUserId,
  }: ProcessVoteInput) => {
    if (voteInfoId == null || contestantId == null) {
      throw new OperationalError('voteinfoId and contestantId are required', 400)
    }

    const { voteInfoDocument } = await this._fetchVotePredicateDocumentsWithSharedLiveId({
      voteInfoId,
      contestantId,
    })

    if (payment.amount !== voteInfoDocument.price) {
      throw new OperationalError('vote info price must be equal to payment amount', 400)
    }

    await new VoteModel({
      contestantId,
      liveId: voteInfoDocument.liveId,
      voterId: currentUserId,
      paymentId: payment._id,
    }).save({ session })
  }

  protected static _preGatewayPaymentOperations = async ({
    currentUserRole,
    currentUserId,
    liveId,
    voteInfoId,
    contestantId,
    email,
    useCase,
    payment,
    session,
  }: PrePaymentOperationsInput) => {
    switch (useCase) {
      case 'live schedule':
        await this._registerLiveClientByEmailAddr({
          currentUserRole: currentUserRole,
          email,
          useCase,
          payment,
        })
        break

      case 'live schedule ext':
        await this._registerLiveClientByEmailAddr({
          currentUserRole,
          email,
          useCase,
          payment,
        })

        await this._registerPaymentExtentions({
          useCase,
          session,
          payment,
          liveId,
        })
        break

      case 'donate':
        await new DonateModel({
          liveId,
          customerId: currentUserId,
          paymentId: payment._id,
        }).save({ session })
        break

      case 'vote':
        await this._registerVote({
          currentUserId,
          payment,
          session,
          contestantId,
          voteInfoId,
        })
        break

      // handled by postOperations
      case 'topup':
        break

      // currently suspended feature
      case 'subscription':
        break
      default:
        throw new OperationalError('unkown use case detected', 403)
    }
  }

  protected static _postPaymentOperationsOnSuccess = async (params: PostPaymentActionsInput) => {
    this._registerPaymentCardDetails(params)

    switch (params.payment.useCase) {
      case 'topup':
        await this._topUpWallet(params)
        break

      case 'live schedule ext':
        await this._extendLive(params)
        break

      case 'donate':
        await this._topUpClientsWallet(params)
        break

      case 'vote':
        await this._updateVote(params)
        break

      // status already updated by the caller
      case 'live schedule':
        break

      case 'subscription':
        break

      default:
        break
    }
  }

  protected static _updateVote = async ({ session, payment }: PostPaymentUsecaseHandlerInput) => {
    const vote = await VoteModel.findOneAndUpdate(
      { paymentId: payment._id },
      { $set: { isDone: true } },
      { session },
    )

    if (vote == null) {
      throw new OperationalError('vote not found for payment: ' + payment._id, 404)
    }
  }

  protected static _registerPaymentCardDetails = async ({
    transaction,
    payment,
    session,
  }: PostPaymentActionsInput) => {
    if (
      payment.status !== 'success' ||
      transaction.channel !== 'card' ||
      payment.storeDetails === false
    ) {
      return
    }

    try {
      await new PaymentDetailModel({
        userId: payment.userId,
        paymentId: payment._id,
        authorization_code: transaction.authorization.authorization_code,
        last4: transaction.authorization.last4,
        exp_month: transaction.authorization.exp_month,
        exp_year: transaction.authorization.exp_year,
        brand: transaction.authorization.brand,
        reusable: transaction.authorization.reusable,
      }).save({ session })
    } catch (e: any) {
      console.error('_registerPaymentCardDetails error:', e.message || e)
    }
  }

  protected static _getStatusFromTransaction: GetStatusFromTransaction = ({ status }) => {
    if (status === 'success') {
      return 'success'
    }

    if (status === 'reversed') {
      return 'reversed'
    }

    if (status === 'abandoned') {
      return 'abandoned'
    }

    if (status === 'processing' || status === 'pending' || status === 'queued') {
      console.error('Paystack is triggering webhooks for pending transactions. Status', status)
      return 'pending'
    }

    return 'failed'
  }

  protected static _topUpWallet = async ({ payment, session }: PostPaymentUsecaseHandlerInput) => {
    await WalletRepo.updateBalance({
      session,
      currency: payment.currency,
      topUpAmount: payment.amount,
      userId: payment.userId,
    })
  }

  protected static _extendLive = async ({ session, payment }: PostPaymentUsecaseHandlerInput) => {
    const live = await LiveModel.findOne({ paymentExtentions: payment._id })

    if (live == null) {
      throw new OperationalError('Could not retrive live for paymentId: ' + payment._id, 400)
    }

    const extendedHours = CalcUtils.liveExtentionFromChargeAndCurrency(
      payment.amount,
      payment.currency,
    )

    addHours(live.expiry, extendedHours)
    await live.save({ session })
  }

  protected static _topUpClientsWallet = async ({
    session,
    payment,
  }: PostPaymentUsecaseHandlerInput) => {
    const donationDocument = await DonateModel.findOne({ paymentId: payment._id })

    if (donationDocument == null) {
      throw new OperationalError('Could not retrive donation document', 400)
    }

    const liveDocument = await LiveModel.findById(donationDocument.liveId)

    if (liveDocument == null) {
      throw new OperationalError('Could not retrive live document', 400)
    }

    await WalletRepo.updateBalance({
      session,
      currency: payment.currency,
      topUpAmount: payment.amount,
      userId: liveDocument.client_id,
    })
  }

  protected static _handleWebhookEventByReferenceTransaction = async (
    reference: string,
    session: MaybeSession,
  ) => {
    const transaction = await Paystack.verifyPayment(reference)

    const payment = await PaymentRepo.updateStatusByReference({
      reference,
      session,
      status: this._getStatusFromTransaction(transaction),
    })

    if (payment === null) {
      throw new OperationalError(`Could not find payment for ref: ${reference}`, 400)
    }

    switch (payment.status) {
      case 'success':
        await this._postPaymentOperationsOnSuccess({
          session,
          transaction,
          payment,
        })
        break
      default:
        throw new OperationalError(
          'Unsuccessfull payment recieved on webhook. Id: ' + payment._id,
          400,
        )
    }
  }

  static handleWebookEventByReference = async (reference: string) => {
    try {
      await withMongoDBSession(this._handleWebhookEventByReferenceTransaction, reference)
    } catch (e: any) {
      console.error('PaymentService.handleWebookEventByReference error', e.message || e)
    }
  }

  protected static _isAdminRole = (role: UserRole) => {
    const adminRoles: UserRole[] = ['admin', 'superadmin']
    return adminRoles.includes(role)
  }

  protected static _isClientRole = (role: UserRole) => {
    const clientRoles: UserRole[] = ['channel', 'event', 'podcast', 'tvshow']
    return clientRoles.includes(role)
  }

  protected static _registerLiveClientByEmailAddr = async ({
    currentUserRole,
    email,
    payment,
  }: AssingLivePaymentUserIdInput) => {
    if (!email) {
      throw new OperationalError('Email is required for a live payment', 400)
    }

    if (!this._isAdminRole(currentUserRole) && !this._isClientRole(currentUserRole)) {
      throw new OperationalError('only an admin or a client can perform this operation', 403)
    }

    const client = await UserModel.findOne({ email })

    if (client == null) {
      throw new OperationalError('Email is not associated with any user', 404)
    }

    if (!this._isClientRole(client.role)) {
      throw new OperationalError('email must be associated with a client', 403)
    }

    // override initiating userId
    payment.userId = client._id
  }

  static initiatePayment = async (params: InitiatePaymentInput) => {
    return await withMongoDBSession(this._initiatePaymentTransaction, params)
  }

  protected static _registerPaymentExtentions = async ({
    liveId,
    payment,
    session,
    useCase,
  }: RegisterWithLiveByLiveIdInput) => {
    if (liveId == null) {
      throw new OperationalError(`liveId is required for  ${useCase} payment`, 400)
    }

    const live = await LiveModel.findByIdAndUpdate(
      liveId,
      {
        $addToSet: { paymentExtentions: payment._id },
      },
      { session },
    )

    if (live == null) {
      throw new OperationalError('invalid live id', 404)
    }
  }

  protected static _handleGatewayPayment = async ({
    currentUser,
    payment,
    session,
    liveId,
    contestantId,
    voteInfoId,
  }: HandleGatewayPaymentInput) => {
    await this._preGatewayPaymentOperations({
      session,
      email: payment.email,
      liveId,
      voteInfoId,
      contestantId,
      currentUserRole: currentUser.role,
      currentUserId: currentUser._id,
      payment,
      useCase: payment.useCase,
    })

    const initPaymentResponse = await Paystack.initializePayment({
      email: payment.email,
      currency: payment.currency,
      amount: payment.amount,
      reference: payment._id.toString(),
    })

    await payment.save({ session })

    const response = Object.assign(initPaymentResponse, {
      paymentId: payment._id,
    })

    return response
  }

  protected static _getVideoById = async (videoId: string | undefined) => {
    if (videoId == null) {
      throw new OperationalError('videoId is required', 400)
    }

    const video = await VideoModel.findById(videoId)

    if (video == null) {
      throw new OperationalError('video not found', 404)
    }

    return video
  }

  protected static _validateWatchPremiumVOD = async (
    payment: PaymentDocument,
    videoId?: string,
  ) => {
    if (
      (payment.currency === 'NGN' && payment.amount < env.NGN_PREMIUM_CONTENT_COST) ||
      (payment.currency === 'USD' && payment.amount < env.USD_PREMIUM_CONTENT_COST)
    ) {
      throw new OperationalError('insufficient payment amount', 403)
    }

    const video = await this._getVideoById(videoId)

    if (video.vid_class !== 'premium') {
      throw new OperationalError('this is not a premium content', 403)
    }
  }

  protected static _validateWatchExclusiveVOD = async (
    payment: PaymentDocument,
    videoId?: string,
  ) => {
    const video = await this._getVideoById(videoId)

    if (video.vid_class !== 'exclusive') {
      throw new OperationalError('this is not an exclusive content', 403)
    }

    if (payment.currency !== video.currency) {
      throw new OperationalError('currency mismatch for payment and content', 403)
    }

    if (video.currency == null || video.amount == null) {
      throw new OperationalError('currency and amount are expected on exclusive contents', 403)
    }

    if (payment.amount !== video.amount) {
      throw new OperationalError('payment amout does not match video cost', 403)
    }
  }

  protected static _validateWatchExclusiveLive = async (
    payment: PaymentDocument,
    liveId?: string,
  ) => {
    if (liveId == null) {
      throw new OperationalError('liveId is required', 400)
    }

    const live = await LiveModel.findById(liveId)

    if (live == null) {
      throw new OperationalError('invalid liveId', 404)
    }

    if (live.amount == null || live.currency == null) {
      throw new OperationalError('currency and amount are expected on exclusive contents', 403)
    }

    if (payment.currency !== live.currency) {
      throw new OperationalError('currency mismatch for payment and content', 403)
    }

    if (payment.amount !== live.amount) {
      throw new OperationalError('invalid payment amount. Expected ' + live.amount, 403)
    }

    return live
  }

  protected static _handleWalletPayment = async ({
    session,
    payment,
    currentUser,
    liveId,
    videoId,
  }: HandleWalletPaymentInput) => {
    // debit customer wallet
    const customerWallet = await WalletRepo.updateBalance({
      userId: currentUser._id,
      topUpAmount: payment.amount * -1,
      currency: payment.currency,
      session,
    })

    if (customerWallet == null) {
      throw new OperationalError('customer wallet not found', 404)
    }

    if (
      (payment.currency === 'NGN' && customerWallet.NGNBalance < 0) ||
      (payment.currency === 'USD' && customerWallet.USDBalance < 0)
    ) {
      throw new OperationalError('insufficient funds', 403)
    }

    switch (payment.useCase) {
      case 'live-watch-exclusive':
        const live = await this._validateWatchExclusiveLive(payment, liveId)

        // credit client wallet
        const clientWallet = await WalletRepo.updateBalance({
          userId: live.client_id,
          topUpAmount: payment.amount,
          currency: payment.currency,
          session,
        })

        const isNairaPayment = payment.currency === 'NGN'

        // create client wallet
        if (clientWallet == null) {
          await new WalletModel({
            userId: live.client_id,
            NGNBalance: isNairaPayment ? payment.amount : 0,
            USDBalance: isNairaPayment ? 0 : payment.amount,
          }).save({ session })
        }
        break

      case 'video-watch-premium':
        await this._validateWatchPremiumVOD(payment, videoId)
        break

      case 'video-watch-exclusive':
        await this._validateWatchExclusiveVOD(payment, videoId)
        break
      default:
        throw new OperationalError('unsupoorted wallet payment', 400)
    }

    await payment.save({ session })
  }

  protected static _initiatePaymentTransaction = async (
    {
      currency,
      currentUser,
      email,
      amount,
      useCase,
      fullName,
      liveId,
      videoId,
      voteInfoId,
      contestantId,
      method,
    }: InitiatePaymentInput,
    session: MaybeSession,
  ) => {
    denyGuestUser(currentUser)

    const status = method === 'wallet' ? 'success' : 'pending'

    fullName = fullName ?? `${currentUser.first_name} ${currentUser.last_name}`
    email = email?.toLowerCase() ?? currentUser.email

    const payment = new PaymentModel({
      userId: currentUser._id,
      currency,
      fullName,
      email,
      amount,
      method,
      status,
      useCase,
      liveId,
      videoId,
    })

    switch (payment.method) {
      case 'paystack':
        return await this._handleGatewayPayment({
          currentUser,
          payment,
          session,
          liveId,
          contestantId,
          voteInfoId,
        })
      case 'wallet':
        await this._handleWalletPayment({
          session,
          currentUser,
          liveId,
          videoId,
          payment,
        })
        break

      default:
        throw new OperationalError('Unsupported payment method', 400)
    }
  }

  static getHistory = async (userId: string, query: ExpressRequestQuery) => {
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

  static setPaymentShouldStoreDetails = async (paymentId: string, shouldStore: boolean) => {
    const payment = await PaymentModel.findByIdAndUpdate(
      paymentId,
      {
        $set: { storeDetails: shouldStore },
      },
      { new: true },
    )

    if (payment == null) {
      throw new OperationalError('invalid payment Id', 404)
    }

    return { shouldStore: payment.storeDetails }
  }

  static fetchWallet = async (user: LoggedInUser) => {
    let wallet: WalletDocument | null = null

    wallet = await WalletModel.findOne({ userId: user._id })

    if (wallet == null) {
      wallet = await WalletModel.create({
        userId: user._id,
      })
    }

    return Object.assign(wallet.toObject(), {
      _id: undefined,
      __v: undefined,
      userId: undefined,
    })
  }
}

