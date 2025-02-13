import { MediaAccess } from '../services/media-access'
import { LiveAggrRes } from '../types/Live'

import { getPromiseAllFulfilledResults } from './promises'
import { VidUploadUtils, VidRes } from './VideoUploadUtils'

export class LiveMediaSourcesUtils {
  static resolveSources = async (lives: LiveAggrRes[], quality: VidRes) => {
    const settled = await Promise.allSettled(
      lives.map(async live => {
        Object.assign(live, {
          previewVideoUpload: VidUploadUtils.getResSourceUrl(live.previewVideoUpload, quality),
          coverPhoto: await MediaAccess.getSignedUrl(
            live.coverPhoto.bucket,
            live.coverPhoto.key,
            'photo',
          ),
        })

        return live
      }),
    )

    return getPromiseAllFulfilledResults(settled)
  }
}
