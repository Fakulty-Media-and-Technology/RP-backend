import { LiveModel } from '../models/lives.model'
import { VideoModel } from '../models/videos.model'
import { S3 } from '../services/aws/s3'
import { fetchUntranscodedVideoUploadDocumentsGenerator } from '../generators/fetchUntranscodedVideoUploads'
import { VideoUpload } from '../models/videoupload.model'
import { EpisodeModel } from '../models/episodes.model'
import { OperationalError } from '../utils/OperationalError'
import { AdModel } from '../models/admanager.model'
import { Document } from 'mongoose'
import { StringOrObjectId } from '../types'
import { SeasonModel } from '../models/seasons.model'

export class CronTaskHandlers {
  protected static checkTranscodedParentDocumentOrThrow = (
    parentDocument: Document | null,
    documentId: StringOrObjectId,
  ) => {
    if (parentDocument == null) {
      new OperationalError(`Loose parent for video upload document with id: ${documentId}`, 404)
    }
  }

  protected static _updateTranscodedDocumentParent = async ({
    parentId,
    parentType,
    isTranscoded,
    _id: videoUploadDocumentId,
  }: VideoUpload) => {
    if (!isTranscoded) {
      throw new OperationalError('_updateTranscodedDocumentParent incorrectly called', 400)
    }

    switch (parentType) {
      case 'vod':
        this.checkTranscodedParentDocumentOrThrow(
          await VideoModel.findByIdAndUpdate(parentId, {
            isVideoReady: true,
          }),
          videoUploadDocumentId,
        )

        break

      case 'vod-trailer':
        this.checkTranscodedParentDocumentOrThrow(
          await VideoModel.findByIdAndUpdate(parentId, {
            isTrailerReady: true,
          }),
          videoUploadDocumentId,
        )

        break

      case 'episode':
        this.checkTranscodedParentDocumentOrThrow(
          await EpisodeModel.findByIdAndUpdate(parentId, {
            isVideoReady: true,
          }),
          videoUploadDocumentId,
        )

        break

      case 'episode-trailer':
        this.checkTranscodedParentDocumentOrThrow(
          await EpisodeModel.findByIdAndUpdate(parentId, {
            isTrailerReady: true,
          }),
          videoUploadDocumentId,
        )
        break

      case 'season-trailer':
        this.checkTranscodedParentDocumentOrThrow(
          await SeasonModel.findByIdAndUpdate(parentId, { isTrailerReady: true }),
          videoUploadDocumentId,
        )

        break

      case 'live':
        this.checkTranscodedParentDocumentOrThrow(
          await LiveModel.findByIdAndUpdate(parentId, { isPreviewVideoReady: true }),
          videoUploadDocumentId,
        )
        break

      case 'ad':
        this.checkTranscodedParentDocumentOrThrow(
          await AdModel.findByIdAndUpdate(parentId, { isVideoReady: true }),
          videoUploadDocumentId,
        )

        break

      case 'subtitle':
        console.error('Transcode subtitle parent encountred')
        break

      default:
        break
    }
  }

  protected static _updateVideoUploadDoc = async (document: VideoUpload) => {
    try {
      const resolutions = await S3.setResolutionsPairs(document.key)
      document.resolutions = resolutions as any
      document.isTranscoded = !!resolutions.length

      if (!document.isTranscoded) {
        return
      }

      await this._updateTranscodedDocumentParent(document)
      await document.save()
    } catch (error) {
      console.error('Error updating isTranscoded for video upload document', document._id)
    }
  }

  static updateVidUploadsResolutions = async () => {
    for await (const videoUploadDouments of fetchUntranscodedVideoUploadDocumentsGenerator()) {
      await Promise.all(videoUploadDouments.map(this._updateVideoUploadDoc))
    }
  }

  static expireFeaturedContents = async () => {
    try {
      const dateNow = new Date()

      const filter = {
        featured: true,
        $and: [
          {
            feat_expiry: { $exists: true },
          },
          {
            feat_expiry: { $gte: dateNow },
          },
        ],
      }

      await LiveModel.updateMany(filter, {
        $set: { featured: false },
      })
      await VideoModel.updateMany(filter, { $set: { featured: false } })
    } catch (error: any) {
      console.log('Cron Error: expire featured content', error.message ?? error)
    }
  }
}
