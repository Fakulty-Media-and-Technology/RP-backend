import { MediaAccess } from '../../../src/services/media-access'
import { ContestantsModel } from '../../models/contestants.model'
import { VoteInfoModel } from '../../models/voteInfo.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'

export class VoteService {
  static fetchVoteInfoByLiveId = async (liveId: unknown) => {
    if (typeof liveId !== 'string') {
      throw new OperationalError('required liveId must be a string', 400)
    }

    return await VoteInfoModel.find({ live_id: liveId })
  }

  static createVoteInfo = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    if (currentUser.role !== 'tvshow') {
      throw new OperationalError('this feature is not available to you', 400)
    }

    const { live_id, price, status } = data

    if (!live_id || !price || !status) {
      throw new OperationalError('all inputs are required', 400)
    }

    const voteExits = await VoteInfoModel.findOne({
      live_id: live_id,
    })

    if (voteExits) {
      throw new OperationalError('vote poll has already been created for this live event', 400)
    }

    await VoteInfoModel.create({
      live_id: live_id,
      client_id: currentUser._id,
      price: Number(price),
      status: status,
    })
  }

  static updateVoteInfo = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    const { live_id, price, status } = data

    const { id: client_id } = currentUser

    const voteEx = await VoteInfoModel.findOne({
      client_id,
      live_id: live_id,
    })

    if (!voteEx) {
      throw new OperationalError('cannot find your live voting instance', 404)
    }

    await VoteInfoModel.findOneAndUpdate(
      {
        client_id,
        live_id: live_id,
      },
      {
        price: price ? Number(price) : voteEx.price,
        status: status ? status : voteEx.status,
      },
      {
        upsert: true,
      },
    )
  }

  static addVoteContestant = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    const { live_id, names, photo, occupation, bio, contact } = data

    if (currentUser.role !== 'tvshow') {
      throw new OperationalError('this feature is not available to you', 400)
    }

    if (!live_id || !names || !occupation || !bio || !contact) {
      throw new OperationalError('all inputs are required', 400)
    }

    await ContestantsModel.create({
      live_id: live_id,
      names: names,
      photo: photo,
      occupation: occupation,
      bio: bio,
      contact: contact,
    })
  }

  static voteStatusInfo = async (currentUser: LoggedInUser, live_id: string) => {
    if (currentUser.role !== 'tvshow') {
      throw new OperationalError('this feature is not available to you', 400)
    }

    const [voteInfo, contestantInfo] = await Promise.all([
      VoteInfoModel.find({ live_id }).select('-__v'),
      ContestantsModel.find({ live_id }).sort({ votes: -1 }),
    ])

    const contestantInfoWithPhotoUrl = contestantInfo.map(async event => {
      return {
        ...event.toObject(),
        photo_url: await MediaAccess.getSignedUrl(event.photo.Bucket, event.photo.Key),
      }
    })

    return {
      vote_info: voteInfo,
      contestant_ranking: contestantInfoWithPhotoUrl,
    }
  }

  static removeVoteContestant = async (
    currentUser: LoggedInUser,
    data: { contestantId: string; liveId: string },
  ) => {
    if (currentUser.role !== 'tvshow') {
      throw new OperationalError('this feature is not available to you', 400)
    }

    const deletedContestant = await ContestantsModel.findOneAndDelete({
      live_id: data.liveId,
      _id: data.contestantId,
    })

    if (deletedContestant) {
      throw new OperationalError('contestant could not be deleted', 404)
    }
  }

  static fetchVoteContestants = (currentUser: LoggedInUser | undefined, liveId: string) => {
    if (currentUser && currentUser.role !== 'tvshow') {
      throw new OperationalError('this feature is not available to you', 400)
    }

    return ContestantsModel.find({ live_id: liveId })
  }
}
