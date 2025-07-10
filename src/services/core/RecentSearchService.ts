import {
  ContentSchema,
  RecentSearchDocument,
  RecentSearchModel,
} from '../../models/recentSearch.model'
import { LiveRepo } from '../../repositories/LiveRepo'
import { VideoRepo } from '../../repositories/VideoRepo'
import { MongoDBObjectId } from '../../types/general'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { VidRes, VidUploadUtils } from '../../utils/VideoUploadUtils'

interface RegisterInput {
  contentId: string
  userId: string
  contentType: ContentSchema['contentType']
}

interface FetcContentsInput {
  vodsIds: MongoDBObjectId[]
  livesIds: MongoDBObjectId[]
}

interface SaturateMediaSourcesInput {
  vods: any[]
  lives: any[]
  quality: VidRes
}

export class RecentSearchService {
  protected static _fetchIdsByContentType = (
    recentSearchDocument: RecentSearchDocument,
    contentType: ContentSchema['contentType'],
  ) =>
    recentSearchDocument.contents
      .filter(search => search.contentType === contentType)
      .map(search => search.contentId)

  static register = async ({ contentId, contentType, userId }: RegisterInput) => {
    await RecentSearchModel.findOneAndUpdate(
      {
        user: userId,
      },
      { $push: { contents: { contentId, contentType } }, $position: 0 },
      { upsert: true },
    )
  }

  protected static _fetchContents = async ({ vodsIds, livesIds }: FetcContentsInput) => {
    const [vodsResult, livesResult] = await Promise.allSettled([
      VideoRepo.fetchByIds(vodsIds),
      LiveRepo.fetchByIds(livesIds),
    ])

    if (vodsResult.status === 'rejected') {
      throw vodsResult.reason
    }

    if (livesResult.status === 'rejected') {
      throw livesResult.reason
    }

    return {
      vods: vodsResult.value,
      lives: livesResult.value,
    }
  }

  protected static _saturateMediaSources = async ({
    vods,
    lives,
    quality,
  }: SaturateMediaSourcesInput) => {
    const [saturatedVodsResult, saturatedLivesResult] = await Promise.allSettled([
      MovieMediaSourcesUtils.resolveMediaSources(vods, true, quality),
      LiveMediaSourcesUtils.resolveSources(lives, quality),
    ])

    if (saturatedVodsResult.status === 'rejected') {
      throw saturatedVodsResult.reason
    }

    if (saturatedLivesResult.status === 'rejected') {
      throw saturatedLivesResult.reason
    }

    return {
      saturatedVods: saturatedVodsResult.value,
      saturatedLives: saturatedLivesResult.value,
    }
  }

  protected static _fetchSearchAndQuality = async (userId: string) => {
    const [qualityResult, searchResult] = await Promise.allSettled([
      VidUploadUtils.getUserVideoQuality(userId, '720p'),
      RecentSearchModel.findOne({ user: userId }),
    ])

    if (qualityResult.status === 'rejected') {
      throw qualityResult.reason
    }

    if (searchResult.status === 'rejected') {
      throw searchResult.reason
    }

    return {
      quality: qualityResult.value,
      recentSearch: searchResult.value,
    }
  }

  static fetch = async (userId: string) => {
    const { quality, recentSearch } = await this._fetchSearchAndQuality(userId)

    if (recentSearch == null || recentSearch.contents.length == 0) {
      return []
    }

    const vodsIds = this._fetchIdsByContentType(recentSearch, 'vod')
    const livesIds = this._fetchIdsByContentType(recentSearch, 'live')
    const totalContents = vodsIds.length + livesIds.length

    if (totalContents === 0) {
      return []
    }

    const { vods, lives } = await this._fetchContents({
      vodsIds,
      livesIds,
    })

    const { saturatedLives, saturatedVods } = await this._saturateMediaSources({
      vods,
      lives,
      quality,
    })

    return {
      vods: saturatedVods,
      lives: saturatedLives,
    }
  }
}
