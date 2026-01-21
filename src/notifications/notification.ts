import { TokenMessage } from 'firebase-admin/lib/messaging/messaging-api'
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

    const message: TokenMessage = {
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
          ...(payload.image && {
            imageUrl: payload.image,
          }),
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
            mutableContent: !!payload.image,
            // contentAvailable: true,
          },
        },

        ...(payload.image && {
          fcmOptions: { imageUrl: payload.image },
        }),
      },
    }

    console.dir({ message }, { depth: null })

    try {
      await admin.messaging().send(message)
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

// Notification.sendPushNotification('', {
//   title: 'Hello my PM',
//   body: 'Come and eat',
//   image: 'https://cdn.taronapp.com/image8f89c33bffff1767090580859',
//   // image: 'https://cdn.taronapp.com/imagef7dd24bfd6041760885965567',
//   type: 'TEST',
//   metadata: {},
// })
