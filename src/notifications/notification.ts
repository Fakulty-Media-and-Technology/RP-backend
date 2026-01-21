import admin from '../firebase/firebase'
import { NotificationModel } from '../models/notifications.model'

interface NotificationPayload {
  title: string
  body: string
  type: string
  metadata: Record<string, any>
  image?: string
}

// ! this is not used anywhere
export class Notification {
  static sendPushNotification = async (token: string, payload: NotificationPayload) => {
    const OSNotification: Pick<NotificationPayload, 'title' | 'body'> = {
      title: payload.title,
      body: payload.body,
    }

    try {
      await admin.messaging().send({
        token,
        data: {
          ...payload,
          metadata: JSON.stringify(payload.metadata),
          ...(payload.image && { image: payload.image }),
        },
        notification: OSNotification,

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
              alert: OSNotification,
              sound: 'default',
              // contentAvailable: true,
            },
          },
        },
      })
    } catch (e) {
      console.log('sendPushNotification error', e)
    }
  }

  static createNotification = async (data: Record<string, any>) => {
    return new Promise(async resolve => {
      await new NotificationModel(data).save()
      resolve(true)
    })
  }
}
