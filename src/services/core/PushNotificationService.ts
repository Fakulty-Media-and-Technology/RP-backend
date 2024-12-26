import { UserDeviceModel } from '../../models/userDevice.model'

export class PushNotificationService {
  static setDeviceToken = async (currentUserId: string, data: Record<string, any>) => {
    const { device_token, device_id, device_type } = data

    await UserDeviceModel.create({
      user_id: currentUserId,
      device_id: device_id,
      device_token: device_token,
      device_type: device_type,
    })
  }

  static updateDeviceToken = async (currentUserId: string, data: Record<string, any>) => {
    const { device_token, device_id, device_type } = data

    const checkDevice = await UserDeviceModel.findOne({
      user_id: currentUserId,
      device_token,
    })

    if (checkDevice) {
      return
    }

    await UserDeviceModel.findOneAndUpdate(
      {
        user_id: currentUserId,
      },
      {
        $set: {
          device_token,
          device_id,
          device_type,
        },
      },
    )
  }
}
