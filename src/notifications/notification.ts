import { TokenMessage } from 'firebase-admin/lib/messaging/messaging-api'
import admin from '../firebase/firebase'
import { NotificationModel } from '../models/notifications.model'
import { UserDeviceModel } from '../models/userDevice.model'
import { Notification as NotificationType } from '../models/notifications.model'

interface NotificationData {
  user_id: string
  type: NotificationType['type']
  _id: string
}

// ! this is not used anywhere
export class Notification {
  static sendPushNotification = async (
    title: string,
    body: Record<string, any>,
    notificationData: NotificationData,
  ) => {
    // Get all user devices
    const userDevices = await UserDeviceModel.find({
      user_id: notificationData.user_id,
    })

    const results = await Promise.allSettled(
      userDevices.map(device => {
        const message: TokenMessage = {
          token: device.device_token,
          notification: {
            title,
            body: JSON.stringify(body),
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
          data: {
            ...notificationData,
            click_action: 'NOTIFICATION_CLICK',
            // Add any additional data needed by the frontend
            notification_id: notificationData._id.toString(),
            type: notificationData.type,
          },
        }

        return admin.messaging().send(message)
      }),
    )

    results.forEach(result => {
      if (result.status === 'rejected') {
        console.error(`Error sending Push notification:`, result.reason)
      }
    })
  }


  static createNotification = async (data: Record<string, any>) => {
    return new Promise(async resolve => {
      await new NotificationModel(data).save()
      resolve(true)
    })
  }
}
