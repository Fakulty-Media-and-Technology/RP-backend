import { User, UserModel } from '../../models/users.model'
import { UserRepo } from '../../repositories/UserRepo'
import { Catch } from '../../utils/Catch'
import { TokenManager } from '../../utils/jwt'
import { OperationalError } from '../../utils/OperationalError'
import { Password } from '../../utils/Password'
import { sendResponse } from '../../utils/responder'

type Role = User['role']

export class AdminOnboardingController {
  private static _createUser = async (data: Record<string, any>, role: Role) => {
    const { first_name, last_name, email, password, cpassword, country_code, mobile } = data

    if (
      !first_name ||
      !last_name ||
      !email ||
      !password ||
      !cpassword ||
      !country_code ||
      !mobile
    ) {
      throw new OperationalError('all input are required', 400)
    }

    // ! email is a unique property. It will throw if it already exists. This check is wasting time
    // const userExist = await UserRepo.getByEmail(email)
    // if (userExist) {
    //   throw new OperationalError('User with email already this exist', 400)
    // }

    if (password !== cpassword) {
      throw new OperationalError('passwords do not match', 400)
    }

    if (!Password.isStrong(password)) {
      throw new OperationalError(
        'password is too weak: use capital, small letter, interger and not less than 8 character',
        400,
      )
    }

    const [encPassword, encPin] = await Promise.all([
      Password.encrypt(password),
      Password.encrypt('1111'),
    ])

    const newUser = new UserModel({
      first_name: first_name,
      last_name: last_name,
      email: email,
      password: encPassword,
      pin: encPin,
      country_code,
      mobile,
      role,
      verified: true,
      approved: true,
    })

    await newUser.save()

    return newUser
  }

  static createAdminORSuperAdmin = (role: Extract<Role, 'superadmin' | 'admin'>) =>
    Catch.async(async (req, res) => {
      await this._createUser(req.body, role)

      sendResponse({
        res,
        message: `New ${role} Account Created successfully`,
      })
    })

  static clientsSignup = Catch.async(async (req, res) => {
    await this._createUser(req.body, req.body.client_type)

    sendResponse({
      res,
      message: 'New Client Account Created successfully',
    })
  })

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
