import { Router } from 'express'
import { CustomerProfileController } from '../../controllers/customers/profile.customer'

export const router = Router()

router.get('/fetch', CustomerProfileController.customerProfileFetch)
router.put('/edit', CustomerProfileController.editProfile)
