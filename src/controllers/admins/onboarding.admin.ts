import { UserSchema, UserModel } from '../../models/users.model'
import { UserRepo } from '../../repositories/UserRepo'
import { MediaManagement } from '../../services/media-management'
import { Catch } from '../../utils/Catch'
import { TokenManager } from '../../utils/jwt'
import { OperationalError } from '../../utils/OperationalError'
import { Password } from '../../utils/Password'
import { throwReasonIfAny } from '../../utils/promises'
import { sendResponse } from '../../utils/responder'

type Role = UserSchema['role']

interface CreateUserInput {
  data: Record<string, any>
  role: Role
  image?: Express.Multer.File
}

export class AdminOnboardingController {
  private static _createUser = async ({ data, role, image }: CreateUserInput) => {
    const { first_name, last_name, email, password, cpassword, country_code, mobile, gender, country, dob } = data

    if (password !== cpassword) {
      throw new OperationalError('passwords do not match', 400)
    }

    if (!Password.isStrong(password)) {
      throw new OperationalError(
        'password is too weak: use capital letter, small letter, interger and not less than 8 character',
        400,
      )
    }

    const user = new UserModel({
      first_name: first_name,
      last_name: last_name,
      email: email,
      country_code,
      mobile,
      role,
      gender,
      country,
      dob,
      verified: true,
      approved: true,
    })

    const handleAuthCreds = async () => {
      const [encPassword, encPin] = await Promise.all([
        Password.encrypt(password),
        Password.encrypt('1111'),
      ])

      user.password = encPassword
      user.pin = encPin
    }

    const handleImage = async () => {
      if (!image) return

      const { Bucket, Key } = await MediaManagement.store({
        file: image,
        expire: undefined,
        baseDir: 'images',
      })

      if (Bucket == null) {
        throw new OperationalError('could not upload photo', 500)
      }

      user.photo = {
        Bucket,
        Key,
      }
    }

    const settled = await Promise.allSettled([handleAuthCreds(), handleImage()])
    throwReasonIfAny(settled)

    await user.save()
  }

  static createAdminORSuperAdmin = (role: Extract<Role, 'superadmin' | 'admin'>) =>
    Catch.async(async (req, res) => {
      await this._createUser({ data: req.body, role, image: req.file })

      sendResponse({
        res,
        message: `New ${role} created`,
      })
    })

  static clientsSignup = Catch.async(async (req, res) => {
    await this._createUser({
      data: req.body,
      role: req.body.client_type,
      image: req.file,
    })

    sendResponse({
      res,
      message: 'New client created',
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
