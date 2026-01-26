import { TokenMessage, TopicMessage } from 'firebase-admin/lib/messaging/messaging-api'
import admin from '../firebase/firebase'
import { NotificationModel } from '../models/notifications.model'
import { UserDeviceModel } from '../models/userDevice.model'
import mongoose from 'mongoose'
import { LIVE_CONTENT_SUB, VOD_CONTENT_SUB } from '../models/content.subscribers.model'

interface NotificationPayload {
  title: string
  body: string
  type: string
  metadata: Record<string, any>
  image?: string
}

type MakeUpcomingTopicPrefix = typeof VOD_CONTENT_SUB | typeof LIVE_CONTENT_SUB

export class Notification {
  static makeContentTopic = (id: string, prefix: MakeUpcomingTopicPrefix) =>
    `${prefix}_UPCOMING_${id}`

  static withUserTokens = (
    userId: string | mongoose.Types.ObjectId,
    callback: (token: string) => void | Promise<void>,
    maxTokens = 5,
  ) => {
    UserDeviceModel.find({ user_id: userId })
      .select('device_token')
      .sort({ _id: -1 })
      .limit(maxTokens)
      .then(documents => documents.forEach(document => callback(document.device_token)))
      .catch(e => console.error('withUserTokens Error', e))
  }

  static subscribeToTopic = async (topic: string, tokens: string | string[]) => {
    try {
      await admin.messaging().subscribeToTopic(tokens, topic)
    } catch (e) {
      console.error('Firebase Admin Sub topic error', 'TOPIC: ', topic, 'ERROR ', e)
    }
  }

  static unsubscribeFromTopic = async (topic: string, tokens: string | string[]) => {
    try {
      await admin.messaging().unsubscribeFromTopic(tokens, topic)
    } catch (e) {
      console.error('Firebase Admin UNSub FROM topic error', 'TOPIC: ', topic, 'ERROR ', e)
    }
  }

  protected static _makeOSPushNotification = (
    payload: NotificationPayload,
  ): Pick<NotificationPayload, 'title' | 'body'> => ({
    title: payload.title,
    body: payload.body,
  })

  static sendTopicPushNotification = async (topic: string, payload: NotificationPayload) => {
    const OSNotification = this._makeOSPushNotification(payload)

    const message: TopicMessage = {
      topic,
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

    try {
      await admin.messaging().send(message)
    } catch (e) {
      console.log('sendTopicPushNotification error', e)
    }
  }

  static sendTokenPushNotification = async (token: string, payload: NotificationPayload) => {
    const OSNotification = this._makeOSPushNotification(payload)

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

    try {
      await admin.messaging().send(message)
    } catch (e) {
      console.log('sendTokenPushNotification error', e)
    }
  }

  static createNotification = async (data: Record<string, any>) => {
    return new Promise(async resolve => {
      await new NotificationModel(data).save()
      resolve(true)
    })
  }
}
