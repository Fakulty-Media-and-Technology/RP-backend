import { NotificationModel } from "../../models/notifications.model"
import { LoggedInUser } from "../../types"
import { OperationalError } from "../../utils/OperationalError"
import { readPhotos } from "../media-access"
import { PushNotificationService } from "./PushNotificationService"

interface GetNotificationsInput {
    currentUser: LoggedInUser
    page: number
    limit: number
  }
  
  export class NotificationService {

    static Push = PushNotificationService

    static getNotifications = async (params: GetNotificationsInput) => {
      const notifications = await NotificationModel.aggregate([
        {
          $match: {
            user_id: params.currentUser._id,
          },
        },
        {
          $lookup: {
            from: 'videos',
            localField: 'content_id',
            foreignField: '_id',
            as: 'content',
          },
        },
        {
          $project: {
            type: 1,
            title: 1,
            categories: 1,
            thumbnail: 1,
            createdAt: 1,
            content: { $first: '$content' },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: (params.page - 1) * params.limit,
        },
        {
          $limit: params.limit,
        },
      ])
  
      // Get signed URLs for thumbnails
      const notificationsWithUrls = await Promise.all(
        notifications.map(async notification => {
          const thumbnailUrl = await readPhotos(
            notification.thumbnail.Bucket,
            notification.thumbnail.Key,
          )
          return {
            ...notification,
            thumbnail_url:
              typeof thumbnailUrl !== 'string' && thumbnailUrl.status === 400 ? null : thumbnailUrl,
          }
        }),
      )
  
      return notificationsWithUrls
    }
  
    static markUserNotificationSeen = async (currentUser: LoggedInUser, notificationId: string) => {
      const seenNotification = await NotificationModel.findOneAndUpdate(
        { _id: notificationId, user_id: currentUser.id },
        { seen: true },
      )
  
      if (seenNotification === null) {
        throw new OperationalError('Invalid notificationId', 404)
      }
    }
  }