import { VideoRepo } from '../../repositories/VideoRepo'
import { LoggedInUser } from '../../types'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'
import { LiveService } from './LiveService'

interface GetVodsByCategoryParams {
  categoryId: string
  query: ExpressRequestQuery
  currentUser: LoggedInUser
}

export class VideoService {
  static Live = LiveService

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
    const vods = await VideoRepo.fetchByCategory(categoryId, page, limit)
    const vidQuality = await VidUploadUtils.getUserVideoQuality(currentUser._id.toString())
    const parsedVods = MovieMediaSourcesUtils.resolveMediaSources(vods, vidQuality)
    return parsedVods
  }
}
