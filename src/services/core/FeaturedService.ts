import { LiveRepo } from '../../repositories/LiveRepo'
import { VideoRepo } from '../../repositories/VideoRepo'
import { LoggedInUser } from '../../types'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, guranteeNumericResult } from '../../utils/QueryParamsFeatures'
import { VideoQuality } from '../../utils/VideoUploadUtils'
import { LiveStreamService } from './LiveStreamService'
import { VideoService } from './VideoService'

type AddFeaturedInput = {
  type: 'vod' | 'event'
  id: string
  expiry: string
}

export class FeaturedService {
  static searchVideosByText = async (text: string, user: LoggedInUser | undefined) => {
    const reg = new RegExp(text, 'i')
    const quality: VideoQuality = user?.videoQuality || '480p'

    const [vods, events] = await Promise.all([
      VideoRepo.searchVodContentByRegex(reg),
      LiveMediaSourcesUtils.resolveSources(await LiveRepo.searchLivesByTextReg(reg), quality),
    ])

    return { vods: MovieMediaSourcesUtils.resolveMediaSources(vods, quality), events }
  }

  static addFeatured = async ({ id, type, expiry }: AddFeaturedInput) => {
    const newFeatured =
      type === 'vod'
        ? await VideoService.addFeatured(id, expiry)
        : await LiveStreamService.addFeatured(id, expiry)

    if (newFeatured === null) {
      throw new OperationalError('Invalid Id', 404)
    }
  }

  static getFeaturedContents = async (query: ExpressRequestQuery) => {
    const page = guranteeNumericResult(query.page, 1)
    const limit = guranteeNumericResult(query.limit, 1)

    const [vods, events] = await Promise.all([
      VideoRepo.fetchFeatured(page, limit),
      LiveMediaSourcesUtils.resolveSources(await LiveRepo.getFeatured(page, limit), '720p'),
    ])

    return {
      vods_contents: MovieMediaSourcesUtils.resolveMediaSources(vods, '720p'),
      lives_contents: events,
    }
  }
}
