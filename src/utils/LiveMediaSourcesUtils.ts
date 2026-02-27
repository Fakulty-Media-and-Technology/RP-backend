import env from '../env'
import { LiveAggrRes } from '../types/Live'

import { getPromiseAllFulfilledResults } from './promises'
import { VidUploadUtils, VideoQuality } from './VideoUploadUtils'

export class LiveMediaSourcesUtils {
  static resolveSources = async (lives: LiveAggrRes[], quality: VideoQuality, isClient = false) => {
    const results = await Promise.allSettled(
      lives.map(async live => {
        const response = {
          previewVideo: VidUploadUtils.getResSourceUrl(live.previewVideoUploadDoc, quality),
          stream_url: env.RP_PLAYBACK_URL + live.streamKey + '/index.m3u8',
          previewVideoUploadDoc: undefined,
        }

        if (isClient) {
          Object.assign(response, {
            stream_server: env.RP_RTMP_SERVER_URL,
            stream_key: live.streamKey,
          })
        }

        Object.assign(live, response)

        return live
      }),
    )

    return getPromiseAllFulfilledResults(results)
  }
}
