import { Router } from 'express'
import { SharedRoutes } from '../../utils/SharedRoutes'

export const router = Router()

new SharedRoutes(router).enums()

