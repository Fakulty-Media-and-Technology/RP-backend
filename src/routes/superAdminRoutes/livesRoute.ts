import { Router } from 'express'
import { AdminManageSharedController } from '../../controllers/admins/managemedia.admin'

export const superAdminLivesRouter = Router()

superAdminLivesRouter.get('/search-clients', AdminManageSharedController.searchClient)
superAdminLivesRouter.get('/all/channels', AdminManageSharedController.getLivesByType('channel'))
superAdminLivesRouter.get('/all/events', AdminManageSharedController.getLivesByType('event'))
superAdminLivesRouter.get('/all/tvshows', AdminManageSharedController.getLivesByType('tvshow'))
