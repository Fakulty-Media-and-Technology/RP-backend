import { Router } from 'express'
import { CustomerMediaController } from '../../controllers/customers/medias.customer'

export const router = Router()

router.post('/upload-photo', CustomerMediaController.uploadImageRoute)
router.post('/vod-streaming/:vidUploadId', CustomerMediaController.getVidoeUploadStream)
router.get('/vod/fetch/featured', CustomerMediaController.getFeaturedVods)
router.post('/vod/like/:id', CustomerMediaController.likeVideo)
router.get('/vod/userliked/:id', CustomerMediaController.userLikedVideo)
router.post('/vod/unlike/:id', CustomerMediaController.unLikeVideo)
