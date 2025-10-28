import env from '../env'
import { MediaAccess } from '../services/media-access'
import { LiveAggrRes } from '../types/Live'
import { signCred } from './live'

import { getPromiseAllFulfilledResults } from './promises'
import { VidUploadUtils, VideoQuality } from './VideoUploadUtils'

export class LiveMediaSourcesUtils {
  static resolveSources = async (lives: LiveAggrRes[], quality: VideoQuality, isClient = false) => {
    const results = await Promise.allSettled(
      lives.map(async live => {
        const signed = `?sign=${signCred(live.streamKey, live.expiry)}`

        const response = {
          previewVideo: VidUploadUtils.getResSourceUrl(live.previewVideoUploadDoc, quality),
          stream_url: env.RP_HLS_URL + live.streamKey + '/index.m3u8' + signed,
          coverPhoto: live.coverPhoto ? MediaAccess.getImageURL(live.coverPhoto.key) : null,
          channelLogo: live.channelLogo ? MediaAccess.getImageURL(live.channelLogo.key) : null,
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
