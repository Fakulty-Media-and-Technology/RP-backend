import { UserDeviceModel } from '../../models/userDevice.model'

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
  }
}
