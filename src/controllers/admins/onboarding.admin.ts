import { UserSchema } from '../../models/users.model'
import { UserRepo } from '../../repositories/UserRepo'
import { Catch } from '../../utils/Catch'
import { TokenManager } from '../../utils/jwt'
import { OperationalError } from '../../utils/OperationalError'
import { Password } from '../../utils/Password'
import { sendResponse } from '../../utils/responder'

export class AdminOnboardingController {
  static adminSignIn = Catch.async(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      throw new OperationalError('all inputs are required', 400)
    }

    const userExist = await UserRepo.getByEmail(email)

    if (!userExist) {
      throw new OperationalError('User does not exist', 400)
    }

    if (
      !['channel', 'tvshow', 'event', 'podcast', 'admin', 'superadmin'].includes(userExist.role)
    ) {
      throw new OperationalError('Admin login: not available to you', 400)
    }

    const passVerify = await Password.compare(password, userExist.password)

    if (!passVerify) {
      throw new OperationalError('incorrect password', 400)
    }

    if (userExist.suspended) {
      throw new OperationalError(
        'you have been suspended from using our services, contact the admin',
        400,
      )
    }

    const tokenPayload = {
      id: userExist.id,
      email: userExist.email,
      role: userExist.role,
    }

    const token = TokenManager.sign('access', tokenPayload)

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
