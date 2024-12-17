import express from 'express'
import { AuthMiddleware } from '../middlewares/auth'

export const adminRouter = express.Router()

adminRouter.use(AuthMiddleware.authenticateRequest('admin-auth'))


