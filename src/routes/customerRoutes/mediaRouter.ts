import { Router } from 'express'
import { CustomerSharedController } from '../../controllers/customers/medias.customer'

export const router = Router()

router.post('/upload-photo', CustomerSharedController.uploadImageRoute)
router.post('/vod-streaming/:vidUploadId', CustomerSharedController.getVidoeUploadStream)
router.get('/vod/fetch/featured', CustomerSharedController.getFeaturedVods)
router.post('/vod/like/:id', CustomerSharedController.likeVideo)
router.get('/vod/userliked/:id', CustomerSharedController.userLikedVideo)
router.post('/vod/unlike/:id', CustomerSharedController.unLikeVideo)
