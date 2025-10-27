import { MediaAccess } from '../../../src/services/media-access'
import { ContestantsModel } from '../../models/contestants.model'
import { LiveModel } from '../../models/lives.model'
import { VoteInfoModel } from '../../models/voteInfo.model'
import { LoggedInUser, MulterFile } from '../../types'
import { ValidCurrency } from '../../utils/currency'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { MediaManagement } from '../media-management'

interface CreateVoteInfoInput {
  liveId: string
  price: number
  currency: ValidCurrency
  currentUser: LoggedInUser
  status?: boolean
}

interface UpdateVoteInfoInput extends Partial<Omit<CreateVoteInfoInput, 'currentUser' | 'liveId'>> {
  currentUser: LoggedInUser
  liveId: string
}

interface AddContestantInput {
  liveId: string
  names: string
  photoFile: MulterFile
  occupation: string
  bio: string
  contact: string
}

export class VoteService {
  static fetchVoteInfoByLiveId = async (liveId: string, query: ExpressRequestQuery) => {
    const info = await new QueryParamsFeatures(VoteInfoModel.find({ liveId }), {
      defaultLimit: 10,
      defaultPage: 0,
      queryParams: query,
    }).paginate().query

    return info
  }

  protected static throwIllegalLive = async (liveId: string, currentUser: LoggedInUser) => {
    const live = await LiveModel.findById(liveId)

    if (live == null) {
      throw new OperationalError('invalid live id', 404)
    }

    if (live.client_id.toString() !== currentUser._id.toString()) {
      throw new OperationalError('Only owner can perform this operation', 403)
    }

    return live
  }

  static createVoteInfo = async ({
    currentUser,
    liveId,
    price,
    status,
    currency,
  }: CreateVoteInfoInput) => {
    const [voteInfoResult] = await Promise.allSettled([
      VoteInfoModel.findOne({ liveId }),
      this.throwIllegalLive(liveId, currentUser),
    ])

    if (voteInfoResult.status === 'rejected') {
      throw voteInfoResult.reason
    }

    if (voteInfoResult.value) {
      throw new OperationalError('vote poll has already been created for this live event', 400)
    }

    await VoteInfoModel.create({
      liveId,
      price,
      currency,
      status,
    })
  }

  static updateVoteInfo = async ({ liveId, price, currency, status }: UpdateVoteInfoInput) => {
    const voteInfo = await VoteInfoModel.findOne({ liveId })

    if (voteInfo == null) {
      throw new OperationalError('could not find vote info', 404)
    }

    voteInfo.price = price ?? voteInfo.price
    voteInfo.status = status ?? voteInfo.status
    voteInfo.currency = currency ?? voteInfo.currency
    voteInfo.status = status ?? voteInfo.status
    await voteInfo.save()
  }

  static addVoteContestant = async (_: LoggedInUser, data: AddContestantInput) => {
    const contestant = new ContestantsModel({
      liveId: data.liveId,
      names: data.names,
      occupation: data.occupation,
      bio: data.bio,
      contact: data.contact,
    })

    const photoUpload = await MediaManagement.store(data.photoFile)

    if (!photoUpload.Key || !photoUpload.Bucket) {
      throw new OperationalError('could not upload photo please try again', 500)
    }

    contestant.photo = {
      Bucket: photoUpload.Bucket,
      Key: photoUpload.Key,
    }

    await contestant.save()
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
        photo_url: await MediaAccess.getSignedUrl(event.photo.Bucket, event.photo.Key, 'photo'),
      }
    })

    return {
      vote_info: voteInfo,
      contestant_ranking: contestantInfoWithPhotoUrl,
    }
  }

  static removeVoteContestant = async (
    _: LoggedInUser,
    data: { contestantId: string; liveId: string },
  ) => {
    const deletedContestant = await ContestantsModel.findOneAndDelete({
      live_id: data.liveId,
      _id: data.contestantId,
    })

    if (deletedContestant == null) {
      throw new OperationalError('invalid contestant Id', 404)
    }
  }

  static fetchVoteContestants = async (liveId: string) => {
    const contestants = await ContestantsModel.find({ liveId }).sort({ name: 1 })

    return await Promise.all(
      contestants.map(async contestant => {
        return {
          ...contestant.toObject(),
          photo_url: await MediaAccess.getSignedUrl(
            contestant.photo.Bucket,
            contestant.photo.Key,
            'photo',
          ),
          photo: undefined,
          __v: undefined,
        }
      }),
    )
  }
}
