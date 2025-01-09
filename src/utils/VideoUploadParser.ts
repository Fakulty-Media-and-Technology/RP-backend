import { Video } from '../models/videos.model'
import { VideoUpload } from '../models/videoupload.model'
import { MediaAccess } from '../services/media-access'
import { getFulfilledValues } from './promise'

type Season = {
  episodes: Episode[]
}

type Episode = {
  video_upload: VideoUpload
}

export class VideoUploadParser {
  static signVideoUploadResolutions = async (videoUpload: VideoUpload) => {
    const { bucket, key, resolutions, isTranscoded } = videoUpload

    const signedResolutions = isTranscoded
      ? await MediaAccess.getVideoUploadResolutionsSignedUrls(bucket, resolutions)
      : [
          {
            resolution: 'raw',
            key: await MediaAccess.getSignedUrl(bucket, key, 'video'),
          },
        ]

    videoUpload.resolutions = signedResolutions as VideoUpload['resolutions']
  }

  static populateVidUploadResolutions = async (vids: Video[], type: Video['type']) => {
    if (type === 'series') {
      const promises = vids.map(async vid => {
        for (const season of vid.seasons) {
          const populatedSeason = season as unknown as Season
          //
          for (const episode of populatedSeason.episodes) {
            await this.signVideoUploadResolutions(episode.video_upload)
          }
        }
        return vid
      })

      vids = getFulfilledValues(await Promise.allSettled(promises))
    } else {
      const settled = await Promise.allSettled(
        vids.map(async vid => {
          await this.signVideoUploadResolutions(vid.video_upload as any)
          return vid
        }),
      )

      vids = getFulfilledValues(settled)
    }

    return vids
  }
}
