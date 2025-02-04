import { Live } from '../models/lives.model'
import { Video } from '../models/videos.model'
import { VideoUpload } from '../models/videoupload.model'
import { MediaAccess } from '../services/media-access'

type Season = {
  episodes: Episode[]
}

type Episode = {
  video_upload: VideoUpload
}

export class VideoUploadParser {
  static signResolutionsOrRaw = (videoUpload: VideoUpload | undefined | null) => {
    if (videoUpload == null || !Array.isArray(videoUpload.resolutions)) return

    if (!videoUpload.isTranscoded) {
      videoUpload.resolutions = [
        {
          resolution: 'raw',
          key: MediaAccess.getCloudFrontSignedUrl(videoUpload.key),
        },
      ] as any

      return
    }

    videoUpload.resolutions = videoUpload.resolutions.map(({ resolution, key }) => ({
      resolution,
      key: MediaAccess.getCloudFrontSignedUrl(key),
    })) as any
  }

  static populateLivesVidUploadResolutions = (lives: Live[]) => {
    lives.forEach(live => {
      this.signResolutionsOrRaw(live.preview_video as any)
    })

    return lives
  }

  static populateVideoVidUploadResolutions = (vids: Video[]) => {
    vids.forEach(video => {
      if (!video.is_series) {
        this.signResolutionsOrRaw(video.video_upload as any)
        return
      }
    })

    return vids
  }
}
