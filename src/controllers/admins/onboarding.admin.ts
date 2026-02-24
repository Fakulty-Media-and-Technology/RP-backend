import { AuthenticationService } from '../../services/core/AuthenticationService'
import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'

export class AdminOnboardingController {
  static adminSignIn = Catch.async(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      throw new OperationalError('all inputs are required', 400)
    }

    const { token, tokenPayload } = await AuthenticationService.adminSignIn(email, password)

    sendResponse({
      res,
      message: 'Admin SignIn successfull',
      statusCode: 201,
      data: {
        ...tokenPayload,
        _id: tokenPayload.id,
        token,
      },
    })
  })

  static adminClientSignInForce = Catch.async(async (req, res) => {
    const { email } = req.body

    if (typeof email !== 'string') {
      throw new OperationalError('Email is Required', 400)
    }

    const { token, tokenPayload } = await AuthenticationService.adminForceClientSignIn(email)

    sendResponse({
      res,
      message: 'Admin SignIn successfull',
      statusCode: 201,
      data: {
        ...tokenPayload,
        _id: tokenPayload.id,
        token,
      },
    })
  })
}
