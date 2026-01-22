import {
  ContentSchema,
  RecentSearchDocument,
  RecentSearchModel,
} from '../../models/recentSearch.model'
import { LiveRepo } from '../../repositories/LiveRepo'
import { VideoRepo } from '../../repositories/VideoRepo'
import { LoggedInUser } from '../../types'
import { MongoDBObjectId } from '../../types/general'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { VideoQuality, VidUploadUtils } from '../../utils/VideoUploadUtils'

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
  quality: VideoQuality
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
  }: SaturateMediaSourcesInput) => ({
    saturatedVods: MovieMediaSourcesUtils.resolveMediaSources(vods, quality),
    saturatedLives: await LiveMediaSourcesUtils.resolveSources(lives, quality),
  })

  static fetch = async (currentUser: LoggedInUser) => {
    const recentSearch = await RecentSearchModel.findOne({ user: currentUser._id })

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
      quality: currentUser.videoQuality,
    })

    return {
      vods: saturatedVods,
      lives: saturatedLives,
    }
  }
}
