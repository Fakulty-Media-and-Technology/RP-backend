import {
  AndroidNotification,
  ApnsConfig,
  BaseMessage,
  TokenMessage,
  TopicMessage,
} from 'firebase-admin/lib/messaging/messaging-api'
import admin from '../firebase/firebase'
import { NotificationModel } from '../models/notifications.model'
import { UserDeviceModel } from '../models/userDevice.model'
import mongoose from 'mongoose'
import { LIVE_CONTENT_SUB, VOD_CONTENT_SUB } from '../models/content.subscribers.model'

export interface NotificationPayload {
  title: string
  body: string
  type: string
  metadata: Record<string, any>
  image?: string
}

type MakeUpcomingTopicPrefix = typeof VOD_CONTENT_SUB | typeof LIVE_CONTENT_SUB

export class Notification {
  static adminMainTopic = 'ADMIN_MAIN'

  static makeContentTopic = (id: string, prefix: MakeUpcomingTopicPrefix) =>
    `${prefix}_UPCOMING_${id}`

  static withUserTokens = (
    userId: string | mongoose.Types.ObjectId,
    callback: (token: string[]) => void | Promise<void>,
    maxTokens = 5,
  ) => {
    UserDeviceModel.find({ user_id: userId })
      .select('device_token')
      .sort({ _id: -1 })
      .limit(maxTokens)
      .then(documents => {
        callback(documents.map(document => document.device_token))
      })
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

  protected static _makeBaseFirebaseMessage = (payload: NotificationPayload): BaseMessage => {
    const OSNotification = this._makeOSPushNotification(payload)

    const data: BaseMessage['data'] = {
      title: payload.title,
      body: payload.body,
      type: payload.type,
      metadata: JSON.stringify(payload.metadata),
    }

    const androidNotification: AndroidNotification = {
      sound: 'default',
    }

    const apnConfiguration: ApnsConfig = {
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
          // badge: 1,
        },
      },
    }

    if (typeof payload.image === 'string') {
      data.image = payload.image
      androidNotification.imageUrl = payload.image
      apnConfiguration.fcmOptions = {
        imageUrl: payload.image,
      }
    }

    return {
      data,
      android: {
        priority: 'high',
        notification: OSNotification,
      },

      apns: apnConfiguration,
    }
  }

  static sendTopicPushNotification = async (topic: string, payload: NotificationPayload) => {
    const message = this._makeBaseFirebaseMessage(payload)

    try {
      await admin.messaging().send({ ...message, topic })
    } catch (e) {
      console.log('sendTopicPushNotification error', e)
    }
  }

  static sendTokenPushNotification = async (token: string, payload: NotificationPayload) => {
    const message = this._makeBaseFirebaseMessage(payload)

    try {
      await admin.messaging().send({ ...message, token })
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
