import { Router } from 'express'
import { OnboardingController } from '../../controllers/customers/onboarding.customer'

export const router = Router()

router.post('/get-token', OnboardingController.getPasswordResetToken)
router.post('/change-pass', OnboardingController.passwordChange)
