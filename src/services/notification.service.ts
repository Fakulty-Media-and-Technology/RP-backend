// const NotificationsModel = require('../models/notifications.model')
// const UsersModel = require('../models/users.model')
// const UserSettingsModel = require('../models/userSettings.model')
// const { sendPushNotification } = require('../notifications/notification')

import { NotificationModel } from '../models/notifications.model'
import { UserModel } from '../models/users.model'
import { Notification } from '../notifications/notification'

exports.createNewArrivalNotification = async (content: any) => {
  // Get users with notifications enabled
  const users = await UserModel.aggregate([
    {
      $match: { role: 'customer' },
    },
    {
      $lookup: {
        from: 'settings',
        localField: '_id',
        foreignField: 'user_id',
        as: 'settings',
      },
    },
    {
      $match: {
        $or: [{ 'settings.allow_notifications': true }, { 'settings.new_arrivals': true }],
      },
    },
  ])

  // Create notifications
  const notifications = users.map(user => ({
    user_id: user._id,
    type: 'NEW_ARRIVAL',
    content_id: content._id,
    title: content.title,
    body: `New arrival: ${content.title} is now available!`,
    categories: [content.genre, content.vid_class, content.category],
    thumbnail: content.cover_photo,
  }))

  // Save notifications to database
  const savedNotifications = await NotificationModel.insertMany(notifications)

  // Send push notifications
  await Promise.all(
    savedNotifications.map(notification =>
      Notification.sendPushNotification(notification.title, notification.body, notification),
    ),
  )
}
