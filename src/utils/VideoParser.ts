import { Video } from '../models/videos.model'
import { MediaAccess } from '../services/media-access'
import { getFulfilledValues } from './promise'

type ResolutionURLSParserInput = {
  key: string
  bucket: string
  resolutionUrls: any[]
}

type Season = {
  episodes: Episode[]
}

type Episode = {
  video_upload: Videoupload
}

type Videoupload = {
  bucket: string
  key: string
  resolutionUrls: ResolutionUrl[]
}

type ResolutionUrl = {
  resolution: string
  key: string
}

export class VideoParser {
  static resolutionUrlsToSignedOrRaw = async (obj: ResolutionURLSParserInput) => {
    if (obj.key.startsWith('transcode/') && obj.resolutionUrls.length) {
      obj.resolutionUrls = await MediaAccess.getTranscodedLocationURLS(
        obj.bucket,
        obj.resolutionUrls,
      )
    } else {
      obj.resolutionUrls = [
        {
          resolution: 'raw',
          key: await MediaAccess.getSignedUrl(obj.bucket, obj.key, 'video'),
        },
      ]
    }
  }

  static populateVidsWithResolutionUrls = async (vids: Video[], type: Video['type']) => {
    if (type === 'series') {
      const settled = await Promise.allSettled(
        vids.map(async vid => {
          for (const season of vid.seasons) {
            const populatedSeason = season as unknown as Season
            for (const episode of populatedSeason.episodes) {
              await this.resolutionUrlsToSignedOrRaw(episode.video_upload)
            }
          }
          return vid
        }),
      )

      vids = getFulfilledValues(settled)
    } else {
      
      const settled = await Promise.allSettled(
        vids.map(async vid => {
          await this.resolutionUrlsToSignedOrRaw(vid.video_upload as any)
          return vid
        }),
      )

      vids = getFulfilledValues(settled)
    }

    return vids
  }
}
