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
  resolutions: ResolutionUrl[]
}

type ResolutionUrl = {
  resolution: string
  key: string
}

export class VideoUploadParser {
  static signResolutions = async (videoUpload: Videoupload) => {
    const { bucket, key, resolutions, isTranscoded } = videoUpload

    videoUpload.resolutions = isTranscoded
      ? await MediaAccess.getTranscodedLocationURLS(bucket, resolutions)
      : [
          {
            resolution: 'raw',
            key: await MediaAccess.getSignedUrl(bucket, key, 'video'),
          },
        ]
  }

  static populateVidUploadResolutions = async (vids: Video[], type: Video['type']) => {
    if (type === 'series') {
      const promises = vids.map(async vid => {
        for (const season of vid.seasons) {
          const populatedSeason = season as unknown as Season
          //
          for (const episode of populatedSeason.episodes) {
            await this.signResolutions(episode.video_upload)
          }
        }
        return vid
      })

      vids = getFulfilledValues(await Promise.allSettled(promises))
    } else {
      const settled = await Promise.allSettled(
        vids.map(async vid => {
          await this.signResolutions(vid.video_upload as any)
          return vid
        }),
      )

      vids = getFulfilledValues(settled)
    }

    return vids
  }
}
