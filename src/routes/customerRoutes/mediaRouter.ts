import { Router } from 'express'
import { SharedController } from '../../controllers/common/shared.controller'

export const router = Router()

router.post('/vod-streaming/:vidUploadId', SharedController.getVidoeUploadStream)
router.get('/vod/fetch/featured', SharedController.getFeaturedVods)
router.post('/vod/like/:id', SharedController.likeVideo)

router.get('/vod/userliked/:id', SharedController.userLikedVideo)
router.post('/vod/unlike/:id', SharedController.unLikeVideo)
