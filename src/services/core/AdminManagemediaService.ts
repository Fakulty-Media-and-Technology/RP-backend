import { Request } from 'express'

import { LiveSchema } from '../../models/lives.model'
import { SubtitleModel } from '../../models/subtitle.model'
import { OperationalError } from '../../utils/OperationalError'
import { guranteeNumericResult, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { VideoModel } from '../../models/videos.model'
import { UserRepo } from '../../repositories/UserRepo'
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
    const { page, limit } = QueryParamsFeatures.paginagteParams(query)
    const regex = new RegExp(searchText, 'i')
    const clients = await UserRepo.adminFetchClientsBySearchAggr(regex, page, limit)
    return clients
  }

  static getLivesByType = async (type: string, query: Request['query']) => {
    const types: LiveSchema['type'][] = ['channel', 'event', 'podcast', 'sport', 'tvshow']

    if (!types.includes(type as any)) {
      throw new OperationalError('invalid live type', 400)
    }

    const lives = await LiveRepo.fetchLivesByType(
      type as LiveSchema['type'],
      guranteeNumericResult(query.page, 1),
      guranteeNumericResult(query.limit, 10),
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

    const { Bucket, Key } = await MediaManagement.storeImageAndSubtitle(data.subtitle)

    const subtitle = await SubtitleModel.create({
      video_id: data.parentId,
      parentType: data.parentType,
      bucket: Bucket,
      key: Key,
      language: data.language,
    })

    return subtitle
  }
}
