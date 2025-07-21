import { Router } from 'express'
import { SocialsController } from '../../controllers/customers/socials.customer'
import { requestValidator } from '../../middlewares/requestValidator'
import {
  createCommentSchema,
  createReplySchema,
  updateCommentSchema,
} from '../../validations/customers'

export const router = Router()

router.put('/create-update/reaction/:commentId/:reaction', SocialsController.createUpdateReaction)

router.delete('/delete/reaction/:reactionId', SocialsController.deleteReaction)

router.post('/create/comment', requestValidator(createCommentSchema), SocialsController.addComment)

router.post('/create/reply', requestValidator(createReplySchema), SocialsController.addReply)

router.get('/fetch/comments/:parentId', SocialsController.getComments)
router.get('/fetch/comments/:commentId/:type', SocialsController.getCommentById)
router.get('/fetch/total-comments/:parentId', SocialsController.getTotalCommentsCount)
router.get('/fetch/replies/:commentId', SocialsController.getReplies)

router
  .route('/comments/:commentId')
  .put(requestValidator(updateCommentSchema), SocialsController.updateComment)
  .delete(SocialsController.deleteComment)
