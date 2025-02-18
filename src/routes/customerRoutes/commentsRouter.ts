import { Router } from 'express'
import { CustomerCommentsRatingsController } from '../../controllers/customers/comments.ratings.customer'
import { requestValidator } from '../../middlewares/requestValidator'
import { createCommentSchema, updateCommentSchema } from '../../validations/customers'

export const router = Router()

router.post(
  '/create',
  requestValidator(createCommentSchema),
  CustomerCommentsRatingsController.addComment,
)
router.get('/fetch/:parentId', CustomerCommentsRatingsController.getComments)

router
  .route('/:commentId')
  .put(requestValidator(updateCommentSchema), CustomerCommentsRatingsController.updateComment)
  .delete(CustomerCommentsRatingsController.deleteComment)
