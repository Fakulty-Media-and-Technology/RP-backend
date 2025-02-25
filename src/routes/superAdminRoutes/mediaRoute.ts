import { Router } from 'express'
import { AdminManageSharedController } from '../../controllers/admins/managemedia.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { Multer } from '../../utils/Multer'
import { getPhotoURLSchema } from '../../validations/admin'

export const superAdminMediaRouter = Router()

superAdminMediaRouter.get(
  '/read-photo',
  requestValidator(getPhotoURLSchema),
  AdminManageSharedController.adminGetPhotoUrl,
)

superAdminMediaRouter.get(
  '/read-subtitle',
  requestValidator(getPhotoURLSchema),
  AdminManageSharedController.adminGetSubtitleUrl,
)

superAdminMediaRouter.get(
  '/read-video/:vidUploadId',
  AdminManageSharedController.getVidoeUploadStream,
)

superAdminMediaRouter.post(
  '/add-subtitle',
  Multer.uploadSingleSubtitle,
  AdminManageSharedController.addSubtitle,
)
