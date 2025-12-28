import admin from '../firebase/firebase'
import { NotificationModel } from '../models/notifications.model'
import { UserDeviceModel } from '../models/userDevice.model'

// ! this is not used anywhere
export class Notification {
  static sendPushNotification = async (title: string, body: string, notificationData: any) => {
    const userDevices = await UserDeviceModel.find({
      user_id: notificationData.user_id,
    })

    const payload = {
      ...notificationData,
      notification: { title, body },
      click_action: 'NOTIFICATION_CLICK',
      notification_id: notificationData._id.toString(),
      type: notificationData.type,
    }

    const results = await Promise.allSettled(
      userDevices.map(device => {
        return admin.messaging().send({
          token: device.device_token,
          data: payload,
          notification: payload.notification,

          android: {
            priority: 'high',

            notification: {
              sound: 'default',
            },
          },

          apns: {
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert',
            },
            
            payload: {
              aps: {
                alert: payload.notification,
                sound: 'default',
                // contentAvailable: true,
              },
            },
          },
        })
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
