import { Router } from 'express'
import { AdminManagemediaController } from '../../controllers/admins/managemedia.admin'

export const superAdminLivesRouter = Router()

superAdminLivesRouter.get('/search-clients', AdminManagemediaController.searchClient)
superAdminLivesRouter.get('/all/channels', AdminManagemediaController.getLivesByType('channel'))
superAdminLivesRouter.get('/all/events', AdminManagemediaController.getLivesByType('event'))
superAdminLivesRouter.get('/all/tvshows', AdminManagemediaController.getLivesByType('tvshow'))
