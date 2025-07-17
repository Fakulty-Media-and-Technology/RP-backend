import { VodWaitlistModel } from '../../models/vodWaitlist.model'
import { VideoRepo } from '../../repositories/VideoRepo'
import { MongoDBObjectId } from '../../types/general'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'

export class VODWaitlistService {
  static isListed = async (currentUserId: MongoDBObjectId, vodId: string) => {
    const response = {
      isListed: false,
    }

    const waitlist = await VodWaitlistModel.findOne({
      userId: currentUserId,
    })

    if (waitlist?.vods == null || waitlist.vods.length === 0) {
      return response
    }

    response.isListed = waitlist.vods.some(vod => vod.toString() === vodId)
    return response
  }

  static add = async (currentUserId: MongoDBObjectId, vodId: string) => {
    await VodWaitlistModel.findOneAndUpdate(
      { userId: currentUserId },
      { $addToSet: { vods: vodId } },
      { upsert: true },
    )
  }

  static remove = async (currentUserId: MongoDBObjectId, vodId: string) => {
    await VodWaitlistModel.findOneAndUpdate({ userId: currentUserId }, { $pull: { vods: vodId } })
  }

  static fetch = async (currentUserId: MongoDBObjectId, query: ExpressRequestQuery) => {
    const [waitlistSettled, vidQualitySettled] = await Promise.allSettled([
      VodWaitlistModel.findOne({
        userId: currentUserId,
      }),

      VidUploadUtils.getUserVideoQuality(currentUserId.toString()),
    ])

    if (waitlistSettled.status === 'rejected') {
      throw waitlistSettled.reason
    }

    if (vidQualitySettled.status === 'rejected') {
      throw vidQualitySettled.reason
    }

    const waitlist = waitlistSettled.value

    if (waitlist == null || waitlist.vods.length === 0) {
      return []
    }

    const { page, limit } = QueryParamsFeatures.paginagteParams(query)

    const vods = await MovieMediaSourcesUtils.resolveMediaSources(
      await VideoRepo.fetchByIds(waitlist.vods, page, limit),
      true,
      vidQualitySettled.value,
    )

    return vods
  }
}
