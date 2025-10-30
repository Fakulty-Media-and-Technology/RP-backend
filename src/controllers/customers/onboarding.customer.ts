import { OnboardingService } from '../../services/core/OnboardingService'
import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'
import { UserSchema } from '../../models/users.model'

export class OnboardingController {
  static createAdminORSuperAdmin = (role: Extract<UserSchema['role'], 'superadmin' | 'admin'>) =>
    Catch.async(async (req, res) => {
      await OnboardingService.createUser({ data: req.body, role, image: req.file })

      sendResponse({
        res,
        message: `New ${role} created`,
      })
    })

  static clientsSignup = Catch.async(async (req, res) => {
    await OnboardingService.createUser({
      data: req.body,
      role: req.body.client_type,
      image: req.file,
    })

    sendResponse({
      res,
      message: 'New client created',
    })
  })

  static customerSignup = Catch.async(async (req, res) => {
    const customer = await OnboardingService.createCustomer(req.body)

    sendResponse({
      res,
      message: 'New Customer Account Created successfully',
      data: customer,
    })
  })

  static createPin = Catch.async(async ({ body }, res) => {
    await OnboardingService.createPin(body)

    sendResponse({
      res,
      message: 'Pin created successfully',
    })
  })

  static resetPin = Catch.async(async ({ params }, res) => {
    await OnboardingService.sendResetPin(params.email)

    sendResponse({
      res,
      message: 'Please check your email address for new PIN',
    })
  })

  static verifyAccount = Catch.async(async (req, res) => {
    const { email, token } = req.body

    if (!email || !token) {
      throw new OperationalError('user email and sent token are required', 400)
    }

    sendResponse({
      res,
      message: 'user account verified',
      data: await OnboardingService.verifyAccount(email, token),
    })
  })

  static signIn = Catch.async(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      throw new OperationalError('all input are required', 400)
    }

    sendResponse({
      res,
      message: 'Sign In successful',
      data: await OnboardingService.signIn(email, password),
    })
  })

  static authTokenValidity = Catch.async(async (req, res) => {
    const { token } = req.query

    sendResponse({
      res,
      message: 'access token is still valid',
      data: { valid: await OnboardingService.validateToken(token, 'access') },
    })
  })

  static refTokenValidity = Catch.async(async (req, res) => {
    const { token } = req.query

    sendResponse({
      res,
      message: 'refresh token is still valid',
      data: { valid: await OnboardingService.validateToken(token, 'refresh') },
    })
  })

  static refreshAccessToken = Catch.async(async (req, res) => {
    const { ref_token } = req.query

    if (typeof ref_token !== 'string') {
      throw new OperationalError('required query.ref_token must be a string', 400)
    }

    sendResponse({
      res,
      message: 'new access token generated from refresh token',
      data: await OnboardingService.refreshAccessToken(ref_token),
    })
  })

  static passwordChange = Catch.async(async ({ body }, res) => {
    await OnboardingService.changePassword(body)
    sendResponse({ res, message: 'password changed successfully' })
  })

  static getVerificationToken = Catch.async(async (req, res) => {
    const u_email = req.query.email

    if (typeof u_email !== 'string') {
      throw new OperationalError('required query.u_email must be a string', 400)
    }

    await OnboardingService.getVerificationToken(u_email)

    sendResponse({
      res,
      message: 'verification code sent to registered email successfully',
    })
  })

  static getPasswordResetToken = Catch.async(async (req, res) => {
    const { email } = req.body

    if (typeof email !== 'string') {
      throw new OperationalError('required body.email must be a string', 400)
    }

    await OnboardingService.getPasswordResetToken(email)

    sendResponse({
      res,
      message: 'password reset email sent to registered email',
    })
  })
}
