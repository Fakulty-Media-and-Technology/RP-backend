import { Router } from 'express'
import { AdminClientsController } from '../../controllers/admins/clients.admin'

export const superAdminClientsRouter = Router()

superAdminClientsRouter.get('/allfetch', AdminClientsController.getAllClients)
superAdminClientsRouter.get('/onefetch/:id', AdminClientsController.getClient)
superAdminClientsRouter.get('/deposits', AdminClientsController.clientDeposits)
