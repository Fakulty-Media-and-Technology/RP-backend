import { UserDeviceModel } from '../../models/userDevice.model'
import { Notification } from '../../notifications/notification'
import { OperationalError } from '../../utils/OperationalError'

export class PushNotificationService {
  static updateDeviceToken = async (currentUserId: string, data: Record<string, any>) => {
    const { device_token, device_id, device_type } = data

    await UserDeviceModel.findOneAndUpdate(
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
  }
}
