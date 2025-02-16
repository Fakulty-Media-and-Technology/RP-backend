import { Request } from 'express'
import { ClientSession } from 'mongoose'

import { LiveModel, LiveSchema } from '../../models/lives.model'
import { SubtitleModel } from '../../models/subtitle.model'
import { OperationalError } from '../../utils/OperationalError'
import { handleDefaultNumAndUnknown, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { VideoModel } from '../../models/videos.model'
import { UserRepo } from '../../repositories/UserRepo'
import { getUniqueStreamKey } from '../../utils/live'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { LiveRepo } from '../../repositories/LiveRepo'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { EpisodeModel } from '../../models/episodes.model'
import { MediaManagement } from '../media-management'

export type AddSubtitleData = {
  parentId: string
  parentType: 'vod' | 'episode'
  language: string
  subtitle: Express.Multer.File
}


export class AdminManageMediaService {
  static searchClient = async (searchText: string, query: Request['query']) => {
    const searchReg = new RegExp(searchText, 'i')

    const features = new QueryParamsFeatures(UserRepo.searchUsersByRegexQuery(searchReg), {
      defaultLimit: 200,
      defaultPage: 1,
      queryParams: query,
    })

    return await features.paginate().query
  }

  static getLivesByType = async (type: LiveSchema['type'], query: Request['query']) => {
    const lives = await LiveRepo.fetchLivesByType(
      type,
      handleDefaultNumAndUnknown(query.page, 1),
      handleDefaultNumAndUnknown(query.limit, 10),
    )

    return await LiveMediaSourcesUtils.resolveSources(lives, '720p')
  }

  private static _findSubtitlesParent = async (data: AddSubtitleData) => {
    switch (data.parentType) {
      case 'episode':
        return await EpisodeModel.findById(data.parentId)

      case 'vod':
        return await VideoModel.findById(data.parentId)

      default:
        throw new OperationalError(`${data.parentType} is not a valid subtitle parent type`, 400)
    }
  }

  static addSubtitle = async (data: AddSubtitleData) => {
    if ((await this._findSubtitlesParent(data)) == null) {
      throw new OperationalError('parent does not exist', 404)
    }

    const { Bucket, Key } = await MediaManagement.store({
      file: data.subtitle,
      expire: undefined,
      baseDir: 'subtitles',
    })

    const subtitle = await SubtitleModel.create({
      video_id: data.parentId,
      parentType: data.parentType,
      bucket: Bucket,
      key: Key,
      language: data.language,
    })

    return subtitle
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

    const vclient_id = await UserRepo.getClientByRolesAndId(data.clientId, [
      'channel',
      'event',
      'podcast',
      'tvshow',
    ])

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

    await new LiveModel({
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

    //   if (live.preview_video) {
    //     await VideoUploadRepo.updateWithParent({
    //       session,
    //       id: live.preview_video.toString(),
    //       parentId: live._id.toString(),
    //       parentType: 'live',
    //     })
    //   }
  }

  static createLive = async (data: Record<string, any>) => {
    return await withMongoDBSession(this._createLiveWithSession, data)
  }
}
