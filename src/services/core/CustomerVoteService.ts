import { MediaAccess } from '../../../src/services/media-access'
import { ContestantsModel } from '../../models/contestants.model'
import { DonateModel } from '../../models/donate.model'
import { LiveModel } from '../../models/lives.model'
import { PaymentModel } from '../../models/payments.model'
import { UserModel } from '../../models/users.model'
import { VoteInfoModel } from '../../models/voteInfo.model'
import { VoteModel } from '../../models/votes.model'
import { WalletModel } from '../../models/wallet.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { VoteService } from './VoteService'

export class CustomerVoteService {
  static fetchVoteInfoByLiveId = async (liveId: unknown) => {
    return await VoteService.fetchVoteInfoByLiveId(liveId)
  }

  static fetchVoteContestantsByLiveId = async (liveId: string) => {
    const contestants = await VoteService.fetchVoteContestants(undefined, liveId).sort({ names: 1 })

    return await Promise.all(
      contestants.map(async event => {
        return {
          ...event.toObject(),
          photo_url: await MediaAccess.getSignedUrl(event.photo.Bucket, event.photo.Key, 'photo'),
        }
      }),
    )
  }

  static createVote = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    const { live_id, contestant_id, payment_id, pay_ref } = data

    const contestant = await ContestantsModel.findOne({
      _id: contestant_id,
      live_id: live_id,
    })

    if (contestant === null) {
      throw new OperationalError('invalid contestant arg, cannot vote', 400)
    }

    const validPay = await PaymentModel.findOne({
      _id: payment_id,
      reference: pay_ref,
      status: 'success',
      is_used: false,
    })

    if (!validPay) {
      throw new OperationalError('invalid payment', 400)
    }

    const voteInfo = await VoteInfoModel.findOne({
      live_id,
    })

    if (!voteInfo) {
      throw new OperationalError('could not find vote info', 404)
    }

    if (validPay.amount !== voteInfo.price) {
      throw new OperationalError('amount paid is not equal to the pay', 404)
    }

    // TODO: Use Session // Handle Update errors

    await PaymentModel.findOneAndUpdate(
      {
        _id: payment_id,
        reference: pay_ref,
      },
      {
        is_used: true,
        use_case: 'vote',
      },
      {
        upsert: true,
      },
    )

    await new VoteModel({
      live_id: live_id,
      contestant_id: contestant_id,
      voter_id: currentUser._id,
      payment_id: validPay._id,
    }).save()

    await ContestantsModel.findOneAndUpdate(
      {
        _id: contestant_id,
        live_id: live_id,
      },
      {
        $inc: {
          votes: 1,
        },
      },
      {
        upsert: true,
      },
    )

    await WalletModel.findOneAndUpdate(
      {
        user_id: voteInfo.client_id,
      },
      {
        $inc: {
          balance: Number(validPay.amount),
        },
      },
      {
        upsert: true,
      },
    )
  }

  static donateFund = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    const { live_id, payment_id, pay_ref } = data

    const validPay = await PaymentModel.findOne({
      _id: payment_id,
      reference: pay_ref,
      status: 'success',
      is_used: false,
    })

    if (!validPay) {
      throw new OperationalError('invalid payment', 400)
    }

    const liveInfo = await LiveModel.findById(live_id)

    if (liveInfo === null) {
      throw new OperationalError('invalid live id', 404)
    }

    const clientInfo = await UserModel.findById(liveInfo.client_id)

    if (clientInfo === null) {
      throw new OperationalError('iinvalid liveInfo client id', 404)
    }

    const donatableRoles = ['channel', 'event', 'podcast']

    if (!donatableRoles.includes(clientInfo.role)) {
      throw new OperationalError(`You can only donate to ${donatableRoles.join(' || ')}`, 400)
    }

    await PaymentModel.findOneAndUpdate(
      {
        _id: payment_id,
        reference: pay_ref,
      },
      {
        is_used: true,
        use_case: 'donate',
      },
      {
        upsert: true,
      },
    )

    // TODO: Use session // handle errors

    await new DonateModel({
      live_id: live_id,
      customer_id: currentUser._id,
      payment_id: validPay._id,
    }).save()

    await WalletModel.findOneAndUpdate(
      {
        user_id: clientInfo._id,
      },
      {
        $inc: {
          balance: Number(validPay.amount),
        },
      },
      {
        upsert: true,
      },
    )
  }
}
