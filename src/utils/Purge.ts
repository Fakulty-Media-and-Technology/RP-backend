import { SubtitleModel } from '../models/subtitle.model'
import { Video } from '../models/videos.model'
import { VideoUploadModel } from '../models/videoupload.model'
import { S3 } from '../services/aws/s3'
import { SeasonModel } from '../models/seasons.model'
import { EpisodeModel } from '../models/episodes.model'
import { Live } from '../models/lives.model'
import { PaymentModel } from '../models/payments.model'
import { MongoDBObjectId } from '../types/general'

export class Purge {
  static live = (live: Live) => {
    const payments: MongoDBObjectId[] = []

    Purge.subtitlesByParentId(live._id)

    live.previewVideoUpload && Purge.videoUploadById(live.previewVideoUpload)
    // live.payment_id && payments.push(live.payment_id)
    // live.extpayment_id && payments.push(live.extpayment_id)

    payments.forEach(async payment => {
      try {
        await PaymentModel.findByIdAndDelete(payment)
      } catch (e) {
        console.error(`Error deleting paymentId: ${payment} for deleted live ${live._id}`)
      }
    })
  }

  static videoUploadById = async (vidUploadId: MongoDBObjectId) => {
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

  // static posterById = async (posterId: MongoDBObjectId) => {
  //   try {
  //     const poster = await PosterImageModel.findByIdAndDelete(posterId)
  //     poster && (await S3.deleteObject(poster.key, poster.bucket))
  //   } catch (e) {
  //     console.error('Error deleting poster with Id:', posterId)
  //   }
  // }

  // static postersByParentId = async (parentId: MongoDBObjectId) => {
  //   try {
  //     const posters = await PosterImageModel.find({ video_id: parentId })

  //     await Promise.all(
  //       posters.map(async ({ key, bucket }) => {
  //         try {
  //           await S3.deleteObject(key, bucket)
  //           await PosterImageModel.findOneAndDelete({ video_id: parentId })
  //         } catch (e) {
  //           console.error(
  //             `Error deleting poster with Key: ${key} => bucket: ${bucket} on VOD delete`,
  //           )
  //         }
  //       }),
  //     )
  //   } catch (e) {
  //     console.error('Error deleting poster with video_id:', parentId)
  //   }
  // }

  static subtitlesByParentId = async (parentId: MongoDBObjectId) => {
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

  static seasonsByVideoId = async (vodId: MongoDBObjectId) => {
    try {
      const seasons = await SeasonModel.find({ video: vodId })

      await Promise.all(
        seasons.map(async season => {
          try {
            const episodes = await EpisodeModel.find({ season: season._id })

            episodes.forEach(async ep => {
              ep.videoUpload && this.videoUploadById(ep.videoUpload)
              ep.trailerUpload && this.videoUploadById(ep.trailerUpload)
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

  static vod = async (videoDocument: Video) => {
    await Promise.allSettled([
      this.subtitlesByParentId(videoDocument._id),
      videoDocument.videoUpload ? this.videoUploadById(videoDocument.videoUpload) : Promise.resolve(),
      videoDocument.trailerUpload ? this.videoUploadById(videoDocument.trailerUpload) : Promise.resolve(),
    ])

    if (videoDocument.type === 'series') {
      this.seasonsByVideoId(videoDocument._id)
    }
  }
}
