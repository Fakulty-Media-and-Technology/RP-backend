import { Router } from 'express'
import { CustomerCommentsRatingsController } from '../../controllers/customers/comments.ratings.customer'
import { requestValidator } from '../../middlewares/requestValidator'
import { createRatingSchema, updateRatingSchema } from '../../validations/customers'

export const router = Router()

router.post(
  '/create',
  requestValidator(createRatingSchema),
  CustomerCommentsRatingsController.addRating,
)

router.get('/fetch/:parentId', CustomerCommentsRatingsController.getRatings)

router
  .route('/:ratingId')
  .put(requestValidator(updateRatingSchema), CustomerCommentsRatingsController.updateRating)
  .delete(CustomerCommentsRatingsController.deleteRating)
