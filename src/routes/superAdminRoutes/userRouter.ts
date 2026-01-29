import { Router } from 'express'
import { AdminUsersController } from '../../controllers/admins/users.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { sendPushNotificationSchema } from '../../validations/admin'
import { Multer } from '../../utils/Multer'

export const superAdminUsersRouter = Router()

superAdminUsersRouter.get('/fetch', AdminUsersController.adminFetchUsers)
superAdminUsersRouter.get('/fetch/:userId', AdminUsersController.adminFetchSingleUser)

superAdminUsersRouter.post(
  '/send-push-notification',
  Multer.uploadSingleImage,
  requestValidator(sendPushNotificationSchema),
  AdminUsersController.sendMainPushNotification,
)
superAdminUsersRouter.delete('/deleteUser/:userId', AdminUsersController.adminDeleteUser)
