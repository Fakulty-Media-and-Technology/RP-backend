import { Request } from 'express'
import { ClientSession } from 'mongoose'

import { LiveModel, LiveSchema } from '../../models/lives.model'
import { SubtitleModel } from '../../models/subtitle.model'
import { UserModel } from '../../models/users.model'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { VideoModel } from '../../models/videos.model'
import { UserRepo } from '../../repositories/UserRepo'
import { getUniqueStreamKey } from '../../utils/live'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { VideoUploadRepo } from '../../repositories/VideoUploadRepo'

export class AdminManageMediaService {
  static searchClient = async (searchText: string, query: Request['query']) => {
    const searchReg = new RegExp(searchText, 'i')

    const features = new QueryParamsFeatures(UserRepo.searchUsersByRegexQuery(searchReg), {
      defaultLimit: 200,
      defaultPage: 1,
      queryParams: query,
    })

    const clients = await features.paginate().query
    return clients
  }

  static getLivesByType = async (type: LiveSchema['type'], query: Request['query']) => {
    const DBQuery = LiveModel.find({ type })
      .select('_id title pg type vid_class active expiry cover_photo views')
      .populate('preview_video')

    const features = new QueryParamsFeatures(DBQuery, {
      defaultLimit: 10,
      defaultPage: 1,
      queryParams: query,
    })

    const lives = await features.paginate().query
    return lives
  }

  static addSubtitle = async (data: Record<string, any>) => {
    const { vid_id, bucket, key, language, is_series } = data

    const vid = await VideoModel.findById(vid_id)

    if (!vid) {
      throw new OperationalError('specified video id not found', 400)
    }

    await SubtitleModel.create({
      video_id: vid_id,
      bucket,
      key,
      language,
      is_series,
    })
  }

  private static _createLiveWithSession = async (data: any, session: ClientSession) => {
    const {
      client_id,
      title,
      sub_title,
      cover_photo,
      vid_class,
      pg,
      category,
      description,
      type,
      start,
      expiry,
      // sponsored,
      // popular,
      video,
      location,
    } = data

    const vclient_id = await UserModel.findOne({
      _id: client_id,
      role: { $in: ['channel', 'event', 'podcast', 'tvshow'] },
    })

    if (!vclient_id) {
      throw new OperationalError('Client not found', 404)
    }

    const [streamOngoing, scheduledStream] = await Promise.all([
      LiveModel.findOne({ client_id, active: true }),
      LiveModel.findOne({ client_id, active: false, expired: false }),
    ])

    if (streamOngoing) {
      throw new OperationalError('client has an ongoing stream', 400)
    }

    if (scheduledStream) {
      throw new OperationalError('client has a scheduled stream', 400)
    }

    const live = await new LiveModel({
      client_id: vclient_id._id,
      title: title,
      sub_title: sub_title,
      stream_key: await getUniqueStreamKey(),
      cover_photo: cover_photo,
      vid_class: vid_class,
      pg: pg,
      category: category,
      description: description,
      type: type,
      start: new Date(start),
      expiry: new Date(expiry),
      // sponsored,
      // popular,
      location,
      preview_video: video,
    }).save({ session })

    if (live.preview_video) {
      await VideoUploadRepo.updateWithParent({
        session,
        id: live.preview_video.toString(),
        parentId: live._id.toString(),
        parentType: 'live',
      })
    }
  }

  static createLive = async (data: Record<string, any>) => {
    return await withMongoDBSession(this._createLiveWithSession, data)
  }
}
