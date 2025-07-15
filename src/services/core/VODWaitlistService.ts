import { VodWaitlistModel } from '../../models/vodWaitlist.model'
import { VideoRepo } from '../../repositories/VideoRepo'
import { StringOrObjectId } from '../../types'
import { MongoDBObjectId } from '../../types/general'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'

export class VODWaitlistService {
  protected static _findByUserId = async (userId: StringOrObjectId) => {
    const waitlist = await VodWaitlistModel.findOne({
      userId,
    })

    if (waitlist == null) {
      throw new OperationalError('not found', 404)
    }

    return waitlist
  }

  static add = async (currentUserId: MongoDBObjectId, vodId: string) => {
    await VodWaitlistModel.findOneAndUpdate(
      { userId: currentUserId },
      { $push: { vods: vodId } },
      { upsert: true },
    )
  }

  static remove = async (currentUserId: MongoDBObjectId, vodId: string) => {
    const waitlist = await this._findByUserId(currentUserId)

    const prevVodsCount = waitlist.vods.length

    // empty waitlist
    if (prevVodsCount === 0) {
      return
    }

    waitlist.vods = waitlist.vods.filter(vod => vod.toString() !== vodId)

    // no changes
    if (prevVodsCount === waitlist.vods.length) {
      return
    }

    await waitlist.save()
  }

  static fetch = async (currentUserId: MongoDBObjectId, query: ExpressRequestQuery) => {
    const [waitlistSettled, vidQualitySettled] = await Promise.allSettled([
      this._findByUserId(currentUserId),
      VidUploadUtils.getUserVideoQuality(currentUserId.toString()),
    ])

    if (waitlistSettled.status === 'rejected') {
      throw waitlistSettled.reason
    }

    if (vidQualitySettled.status === 'rejected') {
      throw vidQualitySettled.reason
    }

    const waitlist = waitlistSettled.value

    if (waitlist.vods.length === 0) {
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
