import express from 'express'
import { adminRouter } from './admin.route'
import { clientsRouter } from './clientRoutes'
import { customerRouter } from './customerRoutes'
import { superAdminRouter } from './superAdminRoutes'

export const v1Router = express.Router()

v1Router.use('/customers', customerRouter)
v1Router.use('/clients', clientsRouter)
v1Router.use('/admin', adminRouter)
v1Router.use('/superadmin', superAdminRouter)

export default v1Router
