import { Router } from 'express'
import { AdminManageSharedController } from '../../controllers/admins/managemedia.admin'

export const superAdminLivesRouter = Router()

superAdminLivesRouter.get('/search-clients', AdminManageSharedController.searchClient)
superAdminLivesRouter.get('/all/:type', AdminManageSharedController.getLivesByType)
