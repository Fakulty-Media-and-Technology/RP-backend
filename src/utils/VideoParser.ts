import { Video } from '../models/videos.model'
import { MediaAccess } from '../services/media-access'
import { getFulfilledValues } from './promise'

type Season = {
  episodes: Episode[]
}

type Episode = {
  video_upload: Videoupload
}

type Videoupload = {
  bucket: string
  key: string
  isTranscoded: boolean
  resolutionUrls: ResolutionUrl[]
}

type ResolutionUrl = {
  resolution: string
  key: string
}

export class VideoParser {
  static signResolutionURLs = async (videoUpload: Videoupload) => {
    const { bucket, key, resolutionUrls, isTranscoded } = videoUpload

    videoUpload.resolutionUrls = isTranscoded
      ? await MediaAccess.getTranscodedLocationURLS(bucket, resolutionUrls)
      : [
          {
            resolution: 'raw',
            key: await MediaAccess.getSignedUrl(bucket, key, 'video'),
          },
        ]
  }

  static populateVidsWithResolutionUrls = async (vids: Video[], type: Video['type']) => {
    if (type === 'series') {
      const promises = vids.map(async vid => {
        for (const season of vid.seasons) {
          const populatedSeason = season as unknown as Season
          //
          for (const episode of populatedSeason.episodes) {
            await this.signResolutionURLs(episode.video_upload)
          }
        }
        return vid
      })

      vids = getFulfilledValues(await Promise.allSettled(promises))
    } else {
      const settled = await Promise.allSettled(
        vids.map(async vid => {
          await this.signResolutionURLs(vid.video_upload as any)
          return vid
        }),
      )

      vids = getFulfilledValues(settled)
    }

    return vids
  }
}
