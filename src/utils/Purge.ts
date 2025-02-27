import mongoose from 'mongoose'
import { PosterImageModel } from '../models/poster.model'
import { SubtitleModel } from '../models/subtitle.model'
import { TrailerModel } from '../models/trailer.model'
import { Video } from '../models/videos.model'
import { VideoUploadModel } from '../models/videoupload.model'
import { S3 } from '../services/aws/s3'
import { SeasonModel } from '../models/seasons.model'
import { EpisodeModel } from '../models/episodes.model'

type ObjectId = mongoose.Types.ObjectId

export class Purge {
  protected static _videoUploadById = async (vidUploadId: ObjectId) => {
    try {
      const vidUpload = await VideoUploadModel.findByIdAndDelete(vidUploadId)

      if (vidUpload == null) return

      S3.deleteObject(vidUpload.key, vidUpload.bucket).catch(() => {
        console.error(
          `Error deleting vidUpload with Key: ${vidUpload.key} => bucket: ${vidUpload.bucket}`,
        )
      })

      vidUpload.resolutions.forEach(res =>
        S3.deleteObject(res.key, vidUpload.bucket).catch(() => {
          console.error(
            `Error deleting video Res with Key: ${res.key} => bucket: ${vidUpload.bucket}`,
          )
        }),
      )
    } catch (e) {
      console.error('Error deleting video upload with Id:', vidUploadId)
    }
  }

  protected static _postersByParentId = async (parentId: ObjectId) => {
    try {
      const posters = await PosterImageModel.find({ video_id: parentId })

      await Promise.all(
        posters.map(async ({ key, bucket }) => {
          try {
            await S3.deleteObject(key, bucket)
            await PosterImageModel.findOneAndDelete({ video_id: parentId })
          } catch (e) {
            console.error(
              `Error deleting poster with Key: ${key} => bucket: ${bucket} on VOD delete`,
            )
          }
        }),
      )
    } catch (e) {
      console.error('Error deleting poster with video_id:', parentId)
    }
  }

  protected static _trailerByParentId = async (parentId: ObjectId) => {
    try {
      const trailer = await TrailerModel.findOneAndDelete({ video_id: parentId })
      trailer && trailer.video_upload && this._videoUploadById(trailer.video_upload)
    } catch (e) {
      console.error(`Error deleting trailer for parent with ID: ${parentId}`)
    }
  }

  protected static _subtitlesByParentId = async (parentId: ObjectId) => {
    try {
      const subtitles = await SubtitleModel.find({ video_id: parentId })

      await Promise.all(
        subtitles.map(async subtitle => {
          try {
            await S3.deleteObject(subtitle.key, subtitle.bucket)
            await SubtitleModel.findByIdAndDelete(subtitle._id)
          } catch (e) {
            console.error('Error deleting Subtitle:', subtitle._id)
          }
        }),
      )
    } catch (e) {
      console.error('Error deleting subtitles for parent:', parentId)
    }
  }

  protected static _seasonsByVideoId = async (vodId: ObjectId) => {
    try {
      const seasons = await SeasonModel.find({ video: vodId })

      await Promise.all(
        seasons.map(async season => {
          try {
            this._postersByParentId(season._id)
            this._trailerByParentId(season._id)

            const episodes = await EpisodeModel.find({ season: season._id })

            episodes.forEach(async ep => {
              this._videoUploadById(ep.videoUpload)
              this._trailerByParentId(ep._id)
            })

            await SeasonModel.findByIdAndDelete(season._id)
          } catch (e) {
            console.error('Error deleting season for VOD:', vodId)
          }
        }),
      )
    } catch (e) {
      console.error('Error deleting seasons for series', vodId)
    }
  }

  public static vod = async (vod: Video) => {
    await Promise.all([
      this._postersByParentId(vod._id),
      this._subtitlesByParentId(vod._id),
      this._trailerByParentId(vod._id),
      this._videoUploadById(vod.video_upload),
    ])

    if (vod.type === 'series') await this._seasonsByVideoId(vod._id)
  }
}
