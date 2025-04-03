import { Router } from 'express'
import { AdminEnumController } from '../../controllers/admins/enums.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import {
  addCategorySchema,
  updateCategorySchema,
  addCastSchema,
  addGenreSchema,
} from '../../validations/admin'

export const superAdminEnumsRouter = Router()

// ** genre
superAdminEnumsRouter.post(
  '/add-genre',
  requestValidator(addGenreSchema),
  AdminEnumController.addGenre,
)
superAdminEnumsRouter.get('/get-genres', AdminEnumController.getGenres)
superAdminEnumsRouter.delete('/rem-genre/:id', AdminEnumController.remGenre)

// *** category

superAdminEnumsRouter.post(
  '/add-category',
  requestValidator(addCategorySchema),
  AdminEnumController.addCategory,
)

superAdminEnumsRouter.get('/get-categories', AdminEnumController.getCategory)
superAdminEnumsRouter.delete('/rem-category/:id', AdminEnumController.remCategory)

superAdminEnumsRouter.put(
  '/update-category/:catId',
  requestValidator(updateCategorySchema),
  AdminEnumController.updateCategory,
)

// *** cast

superAdminEnumsRouter.post(
  '/add-cast',
  requestValidator(addCastSchema),
  AdminEnumController.addCast,
)

superAdminEnumsRouter.get('/get-cast', AdminEnumController.getCast)
superAdminEnumsRouter.delete('/rem-cast/:id', AdminEnumController.remcast)
