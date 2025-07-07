import { Router } from 'express'
import { requestValidator } from '../../middlewares/requestValidator'
import { WatchedController } from '../../controllers/customers/watched.customer'
import { createWatchedSchema } from '../../validations/customers'

export const router = Router()

router.use((req, _, next) => {
  console.log(req.originalUrl, req.method)
  next()
})

router.post('/register', requestValidator(createWatchedSchema), WatchedController.create)
router.get('/continue-watching', WatchedController.continueWatching)
