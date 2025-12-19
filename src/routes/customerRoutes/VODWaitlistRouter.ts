import { Router } from 'express'
import { VODWaitlistController } from '../../controllers/customers/VodWaitlist.customer'

export const VODWaitlistRouter = Router()

VODWaitlistRouter.route('/').get(VODWaitlistController.fetch).delete(VODWaitlistController.clear)

VODWaitlistRouter.route('/:videoId')
  .post(VODWaitlistController.add)
  .delete(VODWaitlistController.remove)
  .get(VODWaitlistController.checkIsListed)
