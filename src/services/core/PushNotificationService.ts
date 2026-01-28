import { fetchUserContentSubGenerator } from '../../generators/fetchUserContentSubcriptions'
import { UserDeviceModel } from '../../models/userDevice.model'
import { Notification } from '../../notifications/notification'
import { OperationalError } from '../../utils/OperationalError'

export class PushNotificationService {
  protected static _manageTokenSubcriptionTopicsForContent = async (
    userId: string,
    mode: 'SUBSCRIBE' | 'UNSUBSCRIBE',
    token: string,
  ) => {
    for await (const contentSubsciptionDocuments of fetchUserContentSubGenerator(userId)) {
      contentSubsciptionDocuments.forEach(document => {
        const topic = Notification.makeContentTopic(
          document.content.toString(),
          document.contentType,
        )

        mode === 'SUBSCRIBE'
          ? Notification.subscribeToTopic(topic, token)
          : Notification.unsubscribeFromTopic(topic, token)
      })
    }
  }

  static updateDeviceToken = async (currentUserId: string, data: Record<string, any>) => {
    const { device_token, device_id, device_type } = data

    const previousDocument = await UserDeviceModel.findOneAndUpdate(
      {
        device_token,
      },
      {
        user_id: currentUserId,
        device_id,
        device_type,
      },
      { upsert: true },
    )

    Notification.subscribeToTopic(Notification.adminMainTopic, device_token)

    if (previousDocument == null || previousDocument.user_id.toString() === currentUserId) {
      return
    }

    const previousUserId = previousDocument.user_id.toString()
    this._manageTokenSubcriptionTopicsForContent(currentUserId, 'SUBSCRIBE', device_token)
    this._manageTokenSubcriptionTopicsForContent(previousUserId, 'UNSUBSCRIBE', device_token)
  }

  static deleteToken = async (currentUserId: string, fcmToken: string) => {
    const deletedDocument = await UserDeviceModel.findOneAndDelete({
      user_id: currentUserId,
      device_token: fcmToken,
    })

    if (deletedDocument == null) {
      throw new OperationalError('Invalid user device token', 404)
    }

    Notification.unsubscribeFromTopic(Notification.adminMainTopic, fcmToken)
    this._manageTokenSubcriptionTopicsForContent(currentUserId, 'UNSUBSCRIBE', fcmToken)
  }
}
