import { Router } from 'express'
import { OnboardingController } from '../../controllers/customers/onboarding.customer'

export const router = Router()

router.get('/validate-token', OnboardingController.authTokenValidity)
router.get('/validate-reftoken', OnboardingController.refTokenValidity)
router.get('/renew-accesstoken', OnboardingController.refreshAccessToken)
