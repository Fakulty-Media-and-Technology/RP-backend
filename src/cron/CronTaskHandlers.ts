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
import {
  liveEvents1hrReminderGenerator,
  liveEvents24hReminderGenerator,
} from '../generators/fetchUpcomingLiveEvents'
import { Notification } from '../notifications/notification'
import { formatTimeWithTimezone } from '../utils/date'

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

  static handleOneHourLiveEventPushReminder = async () => {
    console.log('handleOneHourLiveEventPushReminder started')

    const batchGenerator = liveEvents1hrReminderGenerator({
      batchSize: 20,
    })

    for await (const liveDocuments of batchGenerator) {
      liveDocuments.forEach(async liveDocument => {
        const liveId = liveDocument._id.toString()
        try {
          Notification.sendTopicPushNotification(
            Notification.makeUpcomingContentTopic(liveId, 'LIVE'),
            {
              title: 'Countdown',
              type: 'LIVE_EVENT_REMINDER',
              body: `1 hour to showtime! ${liveDocument.title} starts soon`,
              image: liveDocument.coverPhoto,
              metadata: { liveId },
            },
          )

          await LiveModel.findByIdAndUpdate(liveId, {
            $set: {
              reminder1hSentAt: new Date(),
            },
          })
        } catch (err: any) {
          console.error('handleOneHourLiveEventPushReminder error', err)

          await LiveModel.findByIdAndUpdate(liveId, {
            $inc: { reminder1hAttemptCount: 1 },
            $set: {
              reminder1hLastError: err.message ?? 'handleOneHourLiveEventPushReminder error',
            },
          })
        }
      })
    }
  }
  
  static handle24HourLiveEventPushReminder = async () => {
    console.log('handle24HourLiveEventPushReminder started')

    const batchGenerator = liveEvents24hReminderGenerator({
      batchSize: 20,
    })

    for await (const liveDocuments of batchGenerator) {
      liveDocuments.forEach(async liveDocument => {
        const liveId = liveDocument._id.toString()
        try {
          const message = `Are you set? Tomorrow ${liveDocument.title} goes LIVE by ${formatTimeWithTimezone(liveDocument.start)} on Reeplay`

          Notification.sendTopicPushNotification(
            Notification.makeUpcomingContentTopic(liveId, 'LIVE'),
            {
              title: 'Countdown',
              type: 'LIVE_EVENT_REMINDER',
              body: message,
              image: liveDocument.coverPhoto,
              metadata: { liveId },
            },
          )

          await LiveModel.findByIdAndUpdate(liveId, {
            $set: {
              reminder24hSentAt: new Date(),
            },
          })
        } catch (err: any) {
          console.error('handle24HourLiveEventPushReminder error', err)

          await LiveModel.findByIdAndUpdate(liveId, {
            $inc: { reminder24hAttemptCount: 1 },
            $set: {
              reminder24hLastError: err.message ?? 'handle24HourLiveEventPushReminder error',
            },
          })
        }
      })
    }
  }
}
