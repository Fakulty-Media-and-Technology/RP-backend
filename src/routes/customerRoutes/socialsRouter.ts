import { Router } from 'express'
import { CustomerCommentsRatingsController } from '../../controllers/customers/comments.ratings.customer'
import { requestValidator } from '../../middlewares/requestValidator'
import {
  createCommentSchema,
  createReplySchema,
  updateCommentSchema,
} from '../../validations/customers'

export const router = Router()

router.put(
  '/create-update/reaction/:commentId/:reaction',
  CustomerCommentsRatingsController.createUpdateReaction,
)

router.delete('/delete/reaction/:reactionId', CustomerCommentsRatingsController.deleteReaction)

router.post(
  '/create/comment',
  requestValidator(createCommentSchema),
  CustomerCommentsRatingsController.addComment,
)

router.post(
  '/create/reply',
  requestValidator(createReplySchema),
  CustomerCommentsRatingsController.addReply,
)

router.get('/fetch/comments/:parentId', CustomerCommentsRatingsController.getComments)
router.get('/fetch/replies/:commentId', CustomerCommentsRatingsController.getReplies)

router
  .route('/comments/:commentId')
  .put(requestValidator(updateCommentSchema), CustomerCommentsRatingsController.updateComment)
  .delete(CustomerCommentsRatingsController.deleteComment)
