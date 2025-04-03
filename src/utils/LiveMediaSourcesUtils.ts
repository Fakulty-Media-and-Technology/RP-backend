import { MediaAccess } from '../services/media-access'
import { LiveAggrRes } from '../types/Live'

import { getPromiseAllFulfilledResults } from './promises'
import { VidUploadUtils, VidRes } from './VideoUploadUtils'

export class LiveMediaSourcesUtils {
  static resolveSources = async (lives: LiveAggrRes[], quality: VidRes) => {
    const settled = await Promise.allSettled(
      lives.map(async live => {
        Object.assign(live, {
          previewVideo: VidUploadUtils.getResSourceUrl(live.previewVideoUploadDoc, quality),

          coverPhoto: live.coverPhoto
            ? await MediaAccess.getSignedUrl(live.coverPhoto.bucket, live.coverPhoto.key, 'photo')
            : null,

          channelLogo: live.channelLogo
            ? await MediaAccess.getSignedUrl(live.channelLogo.bucket, live.channelLogo.key, 'photo')
            : null,

          previewVideoUploadDoc: undefined,
        })

        return live
      }),
    )

    return getPromiseAllFulfilledResults(settled)
  }
}
