import { Router } from 'express'
import { OnboardingController } from '../../controllers/customers/onboarding.customer'

export const router = Router()

router.get('/general/validate-token', OnboardingController.authTokenValidity)
router.get('/general/validate-reftoken', OnboardingController.refTokenValidity)
router.get('/general/renew-accesstoken', OnboardingController.refreshAccessToken)
