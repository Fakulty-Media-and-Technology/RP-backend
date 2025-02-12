import { MediaAccess } from '../services/media-access'
import { LiveAggrRes } from '../types/Live'
import { getVidUploadSource } from './MovieMediaSourcesUtils'
import { getPromiseAllFulfilledResults } from './promises'

export class LiveMediaSourcesUtils {
  static resolveSources = async (lives: LiveAggrRes[]) => {
    const settled = await Promise.allSettled(
      lives.map(async live => {
        Object.assign(live, {
          coverPhoto: await MediaAccess.getSignedUrl(
            live.coverPhoto.bucket,
            live.coverPhoto.key,
            'photo',
          ),
        })

        if (live.previewVideoUpload) {
          Object.assign(live, { previewVideoUpload: getVidUploadSource(live.previewVideoUpload) })
        }

        return live
      }),
    )

    return getPromiseAllFulfilledResults(settled)
  }
}
