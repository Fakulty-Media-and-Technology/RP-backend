import { Router } from 'express'
import { SocialsController } from '../../controllers/customers/socials.customer'
import { requestValidator } from '../../middlewares/requestValidator'
import { createRatingSchema, updateRatingSchema } from '../../validations/customers'

export const router = Router()

router.post(
  '/create',
  requestValidator(createRatingSchema),
  SocialsController.addRating,
)

router.get('/fetch/:parentId', SocialsController.getRatings)

router
  .route('/:ratingId')
  .put(requestValidator(updateRatingSchema), SocialsController.updateRating)
  .delete(SocialsController.deleteRating)
