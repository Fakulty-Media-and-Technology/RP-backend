import { Router } from 'express'
import { AdminManagemediaController } from '../../controllers/admins/managemedia.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import { Multer } from '../../utils/Multer'
import { getPhotoURLSchema } from '../../validations/admin'

export const superAdminMediaRouter = Router()

superAdminMediaRouter.get(
  '/read-photo',
  requestValidator(getPhotoURLSchema),
  AdminManagemediaController.adminGetPhotoUrl,
)

superAdminMediaRouter.get(
  '/read-subtitle',
  requestValidator(getPhotoURLSchema),
  AdminManagemediaController.adminGetSubtitleUrl,
)

superAdminMediaRouter.get(
  '/read-video/:vidUploadId',
  AdminManagemediaController.getVidoeUploadStream,
)

superAdminMediaRouter.post(
  '/add-subtitle',
  Multer.uploadSingleSubtitle,
  AdminManagemediaController.addSubtitle,
)
