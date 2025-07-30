import { MediaAccess } from '../../../src/services/media-access'
import { NotificationModel } from '../../models/notifications.model'
import { LoggedInUser, MulterFile } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { PushNotificationService } from './PushNotificationService'
import { AdminNotificationModel } from '../../models/admin.notification.model'
import { MediaManagement } from '../media-management'
import { fetchManyUsersByFilterGenerator, Filter } from '../../generators/fetchAllExceptUserId'
import { UserNotificationModel } from '../../models/customer.notification.model'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { NotificationRepo } from '../../repositories/NotificationRepo'
import { getPromiseAllFulfilledResults } from '../../utils/promises'

interface GetNotificationsInput {
  currentUser: LoggedInUser
  page: number
  limit: number
}

interface UpdateHasSeenParams {
  currentUser: LoggedInUser
  notificationId: string
  hasSeenStatus: boolean
}

interface CreateClientNotification {
  currentUser: LoggedInUser
  title: string
  description: string
}

interface CreateAdminNotification extends CreateClientNotification {
  photoFile?: MulterFile
}

export class NotificationService {
  static createClientNotification = async ({
    currentUser,
    title,
    description,
  }: CreateClientNotification) => {
    const adminNotification = await AdminNotificationModel.create({
      admin: currentUser._id,
      title,
      description,
      photo: currentUser.photo,
    })

    setTimeout(async () => {
      const filter: Filter = {
        role: 'customer',
      }

      for await (const users of fetchManyUsersByFilterGenerator(filter)) {
        users.forEach(async user => {
          try {
            await UserNotificationModel.create({
              adminNotification: adminNotification._id,
              user: user._id,
              publisher: 'Client',
            })
          } catch (e) {
            console.error('Error creating Customer notification for ')
          }
        })
      }
    }, 0)
  }

  static createAdminNotitication = async ({
    currentUser,
    title,
    description,
    photoFile,
  }: CreateAdminNotification) => {
    if (photoFile == null) {
      throw new OperationalError('photo file is required', 400)
    }

    const photoUpload = await MediaManagement.store({
      file: photoFile,
      expire: undefined,
      baseDir: 'images',
    })

    if (photoUpload.Key == null || photoUpload.Bucket == null) {
      throw new OperationalError('error processing photo upload', 500)
    }

    const photoSchema = {
      Bucket: photoUpload.Bucket,
      Key: photoUpload.Key,
    }

    const adminNotification = await AdminNotificationModel.create({
      admin: currentUser._id,
      title,
      description,
      photo: photoSchema,
    })

    setTimeout(async () => {
      const filter: Filter = {
        _id: { $ne: currentUser._id },
      }

      for await (const users of fetchManyUsersByFilterGenerator(filter)) {
        users.forEach(async user => {
          try {
            await UserNotificationModel.create({
              adminNotification: adminNotification._id,
              user: user._id,
              publisher: 'Admin',
            })
          } catch (e) {
            console.error('Error creating Customer notification for ')
          }
        })
      }
    }, 0)
  }

  static getUnseenNotifications = async (currentUser: LoggedInUser, query: ExpressRequestQuery) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const notifications = await NotificationRepo.fetchUnSeenUserNotifications({
      userId: currentUser._id,
      skip,
      limit,
    })

    const withImagesResults = await Promise.allSettled(
      notifications.map(async notification => {
        const result = Object.assign(notification, {
          photoUri:
            notification.adminNotification.photo == null
              ? null
              : await MediaAccess.getSignedUrl(
                  notification.adminNotification.photo.Bucket,
                  notification.adminNotification.photo.Key,
                  'photo',
                ),
        })

        return result
      }),
    )

    return getPromiseAllFulfilledResults(withImagesResults)
  }

  static updateHasSeen = async ({
    currentUser,
    notificationId,
    hasSeenStatus,
  }: UpdateHasSeenParams) => {
    const notification = await UserNotificationModel.findOneAndUpdate(
      { _id: notificationId, user: currentUser._id },
      { $set: { hasSeen: hasSeenStatus } },
    )

    if (notification == null) {
      throw new OperationalError('Notfication not found', 404)
    }
  }

  // OLD
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
        return {
          ...notification,
          thumbnail_url: await MediaAccess.getSignedUrl(
            notification.thumbnail.Bucket,
            notification.thumbnail.Key,
            'photo',
          ),
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
