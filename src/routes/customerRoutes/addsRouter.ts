import { Router } from 'express'
import { AdsController } from '../../controllers/common/ad.controller'

export const router = Router()

router.get('/random', AdsController.fetchRandom)
