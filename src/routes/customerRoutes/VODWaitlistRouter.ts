import { Router } from 'express'
import { VODWaitlistController } from '../../controllers/customers/VodWaitliest.customer'

export const VODWaitlistRouter = Router()

VODWaitlistRouter.get('/', VODWaitlistController.fetch)

VODWaitlistRouter.route('/:videoId')
  .post(VODWaitlistController.add)
  .delete(VODWaitlistController.remove)
