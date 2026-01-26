import { AdminUsersService } from '../../services/core/AdminUsersService'
import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'

export class AdminUsersController {
  static sendMainPushNotification = Catch.async(async ({ body }, res) => {
    AdminUsersService.sendAdminMainTopicPushNotification({
      ...body,
      metadata: body.metadata ?? {},
      type: body.type || 'MAIN_ADMIN_TOPIC_NOTIFICATION',
    })

    sendResponse({
      res,
      data: null,
      message: 'sent',
    })
  })

  static adminFetchUsers = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      data: await AdminUsersService.fetchAll(query),
      message: 'Users detials fetched',
    })
  })

  static adminFetchSingleUser = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await AdminUsersService.fetchOne(req.params.userId),
      message: 'user fetched successfully',
    })
  })

  static adminDeleteUser = Catch.async(async (req, res) => {
    await AdminUsersService.deleteOne(req.params.userId)

    sendResponse({
      res,
      message: 'user deleted successfully',
    })
  })
}
