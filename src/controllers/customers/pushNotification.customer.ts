import { NotificationService } from '../../services/core/NotificationService'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class PushNotificationController {
  static registerDeviceToken = Catch.async(async ({ user, body }, res) => {
    await NotificationService.Push.setDeviceToken(GetDefined.loggedInUser(user).id, body)

    sendResponse({
      res,
      message: 'FCM device token registered successfully',
    })
  })

  static updateDeviceToken = Catch.async(async ({ user, body }, res) => {
    await NotificationService.Push.updateDeviceToken(GetDefined.loggedInUser(user).id, body)

    sendResponse({
      res,
      message: 'FCM device token updated successfully',
    })
  })
}
