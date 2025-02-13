import { UpcomingAggrRes } from '../types/upcoming'
import { MovieMediaSourcesUtils } from './MovieMediaSourcesUtils'
import { getPromiseAllFulfilledResults } from './promises'
import { VidRes, VidUploadUtils } from './VideoUploadUtils'

export class UpcomingMediaSourceUtils extends MovieMediaSourcesUtils {
  static resolveSources = async (upcomings: UpcomingAggrRes[], quality: VidRes) => {
    const upsWithSources = await Promise.allSettled(
      upcomings.map(async upcoming => {
        const { landscapePhoto, portraitPhoto } = await this._getMoviePhotos(upcoming)

        Object.assign(upcoming, {
          landscapePhoto,
          portraitPhoto,
          trailer: VidUploadUtils.getResSourceUrl(upcoming.trailerVideoUpload, quality),
          trailerVideoUpload: undefined,
        })

        return upcoming
      }),
    )

    return getPromiseAllFulfilledResults(upsWithSources)
  }
}
