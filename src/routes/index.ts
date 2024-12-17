import express from 'express'
import { superAdminRouter } from './superadmin.route'
import { adminRouter } from './admin.route'
import { clientsRouter } from './clients.route'
import { customerRouter } from './customers.route'

export const v1Router = express.Router()

v1Router.use('/customers', customerRouter)
v1Router.use('/clients', clientsRouter)
v1Router.use('/admin', adminRouter)
v1Router.use('/superadmin', superAdminRouter)

export default v1Router
