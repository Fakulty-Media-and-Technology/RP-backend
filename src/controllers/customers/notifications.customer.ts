import { NotificationService } from '../../services/core/NotificationService'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { handleDefaultNumAndUnknown } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'

export class NotificationController {
  static getNotifications = Catch.async(async ({ user, query }, res) => {
    const data = await NotificationService.getNotifications({
      currentUser: GetDefined.loggedInUser(user),
      page: handleDefaultNumAndUnknown(query.page, 1),
      limit: handleDefaultNumAndUnknown(query.limit, 20),
    })

    sendResponse({
      res,
      data,
      message: 'Notifications fetched successfully',
    })
  })

  static handleNotificationClick = Catch.async(
    async ({ user, params: { notification_id } }, res) => {
      await NotificationService.markUserNotificationSeen(
        GetDefined.loggedInUser(user),
        notification_id,
      )

      sendResponse({
        res,
        message: 'Notification marked as seen',
        data: { notification_id },
      })
    },
  )
}
