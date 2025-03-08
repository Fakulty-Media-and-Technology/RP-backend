import { LiveRepo } from '../../repositories/LiveRepo'
import { VideoRepo } from '../../repositories/VideoRepo'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, handleDefaultNumAndUnknown } from '../../utils/QueryParamsFeatures'
import { VideoService } from './VideoService'

type AddFeaturedInput = {
  type: 'vod' | 'event'
  id: string
  expiry: string
}

export class FeaturedService {
  static searchVideosByText = async (text: string) => {
    const reg = new RegExp(text, 'i')

    const [vods, events] = await Promise.all([
      MovieMediaSourcesUtils.resolveMediaSources(
        await VideoRepo.searchTitleOrDescriptionByTextReg(reg),
        true,
        '1080p',
      ),

      LiveMediaSourcesUtils.resolveSources(await LiveRepo.searchLivesByTextReg(reg), '1080p'),
    ])

    return { vods, events }
  }

  static addFeatured = async ({ id, type, expiry }: AddFeaturedInput) => {
    const newFeatured =
      type === 'vod'
        ? await VideoService.addFeatured(id, expiry)
        : await VideoService.Live.addFeatured(id, expiry)

    if (newFeatured === null) {
      throw new OperationalError('Invalid Id', 404)
    }
  }

  static getFeaturedContents = async (query: ExpressRequestQuery) => {
    const page = handleDefaultNumAndUnknown(query.page, 1)
    const limit = handleDefaultNumAndUnknown(query.limit, 1)

    const [vods, events] = await Promise.all([
      MovieMediaSourcesUtils.resolveMediaSources(
        await VideoRepo.fetchFeatured(page, limit),
        true,
        '720p',
      ),

      LiveMediaSourcesUtils.resolveSources(await LiveRepo.getFeatured(page, limit), '720p'),
    ])

    return {
      vods_contents: vods,
      lives_contents: events,
    }
  }
}
