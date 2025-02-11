import { MediaAccess } from '../services/media-access'
import { LiveAggrRes } from '../types/Live'
import { getVidUploadSource } from './MovieMediaSourcesUtils'
import { getFulfilledValues } from './promise'

export class LiveMediaSourcesUtils {
  static resolveSources = async (lives: LiveAggrRes[]) => {
    const settled = await Promise.allSettled(
      lives.map(async live => {
        const res: Record<string, any> = {
          ...live,
          coverPhoto: await MediaAccess.getSignedUrl(
            live.coverPhoto.bucket,
            live.coverPhoto.key,
            'photo',
          ),
        }

        if (live.previewVideoUpload) {
          res.previewVideoUpload = getVidUploadSource(live.previewVideoUpload)
        }

        return res
      }),
    )

    return getFulfilledValues(settled)
  }
}
