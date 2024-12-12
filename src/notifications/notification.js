const admin = require('../firebase/firebase')
const NotificationsModel = require('../models/notifications.model')
const UserDeviceModel = require('../models/userDevice.model')

exports.sendPushNotification = async (title, body, notificationData = {}) => {
  try {
    // Get all user devices
    const userDevices = await UserDeviceModel.find({
      user_id: notificationData.user_id,
    })

    // Send to all user devices
    const notifications = userDevices.map(device => ({
      token: device.device_token,
      notification: {
        title,
        body,
      },
      data: {
        ...notificationData,
        click_action: 'NOTIFICATION_CLICK',
        // Add any additional data needed by the frontend
        notification_id: notificationData._id?.toString(),
        type: notificationData.type,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default_channel',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    }))

    // Send notifications in parallel
    const results = await Promise.all(
      notifications.map(notification => admin.messaging().send(notification)),
    )

    console.log('Push notifications sent:', results)
    return true
  } catch (error) {
    console.error('Error sending push notification:', error)
    return false
  }
}

exports.sendPush = async () => {
  const message = {
    token:
      'fu8nrVNLQs2euLjEI7uDY3:APA91bE9UhxVjLGCVHz7kfOl85t7ZRTc8Kz0BQm_2-0USryPrmnI3mpmKauwOtgDa9Wtp7toS6vRLNf0Wfv4cypzNnEX5uyZo8zjPNixKzaYgdLTRJyNlD3OwDqu8rztqqFxMRLhFzAG',
    notification: {
      title: 'Your Notification Title',
      body: 'Your Notification Body',
    },
    data: {
      key1: 'value1',
      key2: 'value2',
    },
    android: {
      notification: {
        channelId: 'default_channel',
      },
    },
  }

  admin
    .messaging()
    .send(message)
    .then(response => {
      console.log('Notification sent:', response)
    })
    .catch(error => {
      console.error('Error sending notification:', error)
    })
}

exports.createNotification = async data => {
  return new Promise(async (resolve, reject) => {
    await new NotificationsModel(data).save()
    resolve(true)
  })
}
