import { Aggregate } from 'mongoose'
import { MongoDBObjectId } from '../types/general'
import { AdminNotificationSchema } from '../models/admin.notification.model'
import {
  UserNotificationSchema,
  UserNotificationModel,
} from '../models/customer.notification.model'

interface UserNotification extends Omit<UserNotificationSchema, 'adminNotification'> {
  adminNotification: AdminNotificationSchema & { _id: MongoDBObjectId }
}

interface FetchUnseenUserNotificationsParams {
  userId: MongoDBObjectId
  skip: number
  limit: number
}

export class NotificationRepo {
  static fetchUnSeenUserNotifications = ({
    userId,
    skip,
    limit,
  }: FetchUnseenUserNotificationsParams) => {
    const res = UserNotificationModel.aggregate([
      { $match: { user: userId, hasSeen: false } },

      {
        $lookup: {
          from: 'admin-notifications',
          localField: 'adminNotification',
          foreignField: '_id',
          as: 'adminNotification',
        },
      },

      { $match: { 'adminNotification.0': { $exists: true } } },
      { $set: { adminNotification: { $first: '$adminNotification' } } },
      { $skip: skip },
      { $limit: limit },
    ])

    return res as Aggregate<UserNotification[]>
  }
}
