import env from '../env'
import { MediaAccess } from '../services/media-access'
import { LiveAggrRes } from '../types/Live'
import { signCred } from './live'

import { getPromiseAllFulfilledResults } from './promises'
import { VidUploadUtils, VidRes } from './VideoUploadUtils'

export class LiveMediaSourcesUtils {
  static resolveSources = async (lives: LiveAggrRes[], quality: VidRes, isClient = false) => {
    const results = await Promise.allSettled(
      lives.map(async live => {
        const signed = `?sign=${signCred(live.streamKey, live.expiry)}`

        const response = {
          previewVideo: VidUploadUtils.getResSourceUrl(live.previewVideoUploadDoc, quality),
          stream_url: env.RP_HLS_URL + live.streamKey + '/index.m3u8' + signed,
          coverPhoto: live.coverPhoto
            ? await MediaAccess.getSignedUrl(live.coverPhoto.bucket, live.coverPhoto.key, 'photo')
            : null,

          channelLogo: live.channelLogo
            ? await MediaAccess.getSignedUrl(live.channelLogo.bucket, live.channelLogo.key, 'photo')
            : null,

          previewVideoUploadDoc: undefined,
        }

        if (isClient) {
          Object.assign(response, {
            stream_server: env.RP_RTMP_URL,
            stream_key: live.streamKey + signed,
          })
        }

        Object.assign(live, response)

        return live
      }),
    )

    return getPromiseAllFulfilledResults(results)
  }
}
