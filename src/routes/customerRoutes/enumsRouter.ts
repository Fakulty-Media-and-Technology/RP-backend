import { Router } from 'express'
import { SharedRoutes } from '../SharedRoutes'

export const router = Router()

new SharedRoutes(router).enums()
