import { Router } from 'express'
import { AdminEnumController } from '../../controllers/admins/enums.admin'
import { requestValidator } from '../../middlewares/requestValidator'
import {
  addCategorySchema,
  updateCategorySchema,
  addCastSchema,
  addGenreSchema,
  editCastSchema,
  updateGenreSchema,
} from '../../validations/admin'

import { SharedRoutes } from '../../utils/SharedRoutes'
import { Multer } from '../../utils/Multer'

export const superAdminEnumsRouter = Router()

new SharedRoutes(superAdminEnumsRouter).enums()

// ** genre
superAdminEnumsRouter.post(
  '/add-genre',
  requestValidator(addGenreSchema),
  AdminEnumController.addGenre,
)

superAdminEnumsRouter.delete('/rem-genre/:id', AdminEnumController.remGenre)

superAdminEnumsRouter.put(
  '/update-genre/:genreId',
  requestValidator(updateGenreSchema),
  AdminEnumController.updateGenre,
)

// *** category
superAdminEnumsRouter.post(
  '/add-category',
  requestValidator(addCategorySchema),
  AdminEnumController.addCategory,
)

superAdminEnumsRouter.delete('/rem-category/:id', AdminEnumController.remCategory)

superAdminEnumsRouter.put(
  '/update-category/:catId',
  requestValidator(updateCategorySchema),
  AdminEnumController.updateCategory,
)

// *** cast
superAdminEnumsRouter.post(
  '/add-cast',
  Multer.uploadSingleImage,
  requestValidator(addCastSchema),
  AdminEnumController.addCast,
)

superAdminEnumsRouter.get('/search-casts/:searchText', AdminEnumController.searchCasts)

superAdminEnumsRouter.put(
  '/edit-cast/:castId',
  Multer.uploadSingleImage,
  requestValidator(editCastSchema),
  AdminEnumController.editCast,
)

superAdminEnumsRouter.delete('/rem-cast/:id', AdminEnumController.remcast)
