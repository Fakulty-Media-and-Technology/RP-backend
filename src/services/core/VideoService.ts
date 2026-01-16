import { VideoRepo } from '../../repositories/VideoRepo'
import { LoggedInUser } from '../../types'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'

interface GetVodsByCategoryParams {
  categoryId: string
  query: ExpressRequestQuery
  currentUser: LoggedInUser
}

export class VideoService {
  static searceByText = async (text: string) =>
    await VideoRepo.searchVodContentByRegex(new RegExp(text, 'i'))

  static addFeatured = async (id: string, expiry: string) => await VideoRepo.addFeatured(id, expiry)

  static getFeaturedVideos = async () => await VideoRepo.fetchFeatured()

  static getVodsForCategory = async ({
    categoryId,
    query,
    currentUser,
  }: GetVodsByCategoryParams) => {
    const { page, limit } = QueryParamsFeatures.paginagteParams(query)

    const [vodsResult, qualityResult] = await Promise.allSettled([
      VideoRepo.fetchByCategory(categoryId, page, limit),
      VidUploadUtils.getUserVideoQuality(currentUser._id.toString()),
    ])

    if (vodsResult.status === 'rejected') {
      throw vodsResult.reason
    }

    if (qualityResult.status === 'rejected') {
      throw qualityResult.reason
    }

    const vods = vodsResult.value
    const vidQuality = qualityResult.value
    const hydratedVods = MovieMediaSourcesUtils.resolveMediaSources(vods, vidQuality)
    return hydratedVods
  }
}
