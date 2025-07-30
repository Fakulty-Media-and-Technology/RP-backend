import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'
import { GetDefined } from '../../utils/GetDefined'
import { NotificationService } from '../../services/core/NotificationService'

export class NotificationController {
  static createAdminNotification = Catch.async(async (req, res) => {
    await NotificationService.createAdminNotitication({
      currentUser: GetDefined.loggedInUser(req.user),
      title: req.body.title,
      description: req.body.description,
      photoFile: req.file,
    })

    sendResponse({
      res,
      message: 'Notification created successfully',
    })
  })

  static createClientNotification = Catch.async(async (req, res) => {
    await NotificationService.createClientNotification({
      currentUser: GetDefined.loggedInUser(req.user),
      title: req.body.title,
      description: req.body.description,
    })

    sendResponse({
      res,
      message: 'Notification created successfully',
    })
  })

  static getUnseenNotifications = Catch.async(async (req, res) => {
    const notifications = await NotificationService.getUnseenNotifications(
      GetDefined.loggedInUser(req.user),
      req.query,
    )

    sendResponse({
      res,
      data: notifications,
    })
  })

  static updateHasSeenNotification = Catch.async(async (req, res) => {
    await NotificationService.updateHasSeen({
      currentUser: GetDefined.loggedInUser(req.user),
      notificationId: req.body.notificationId,
      hasSeenStatus: req.body.hasSeenStatus,
    })

    sendResponse({
      res,
    })
  })
}
