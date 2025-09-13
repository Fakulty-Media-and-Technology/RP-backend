import { UserDocument, UserModel, UserSchema } from '../../models/users.model'
import { SettingsModel } from '../../models/userSettings.model'
import { UserRepo } from '../../repositories/UserRepo'
import { authCode } from '../../utils/strGen'
import Email from '../../utils/emailer'
import { TokenManager } from '../../utils/jwt'
import { OperationalError } from '../../utils/OperationalError'
import { Password } from '../../utils/Password'
import { ClientSession } from 'mongoose'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import env from '../../env'
import { MulterFile } from '../../types'
import { throwReasonIfAny } from '../../utils/promises'
import { MediaManagement } from '../media-management'

type Role = UserSchema['role']

interface CreateUserInput {
  data: Record<string, any>
  role: Role
  image?: Express.Multer.File
}

export class OnboardingService {
  protected static _handleUserImageUpload = async (user: UserDocument, image?: MulterFile) => {
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

  protected static _handleAuthCreds = async (user: UserDocument, password: string) => {
    const [encPasswordResult, encPinResult] = await Promise.allSettled([
      Password.encrypt(password),
      Password.encrypt('1111'),
    ])

    if (encPasswordResult.status === 'rejected') {
      throw encPasswordResult.reason
    }

    if (encPinResult.status === 'rejected') {
      throw encPinResult.reason
    }

    user.password = encPasswordResult.value
    user.pin = encPinResult.value
  }

  static createUser = async ({ data, role, image }: CreateUserInput) => {
    const {
      first_name,
      last_name,
      email,
      password,
      cpassword,
      country_code,
      mobile,
      gender,
      country,
      dob,
    } = data

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

    const settled = await Promise.allSettled([
      this._handleAuthCreds(user, password),
      this._handleUserImageUpload(user, image),
    ])

    throwReasonIfAny(settled)
    await user.save()

    if (role !== 'customer') {
      return
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    const token = TokenManager.sign('access', tokenPayload)
    const refToken = TokenManager.sign('refresh', tokenPayload)

    return {
      _id: user._id,
      email: user.email,
      role: user.role,
      accessToken: token,
      refreshToken: refToken,
      verificationPin: user.pin,
    }
  }

  private static _createCustomerWithSession = async (
    data: Record<string, any>,
    session: MaybeSession,
  ) => {
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
      throw new OperationalError(`All inputs are required.`, 400)
    }

    if (password !== cpassword) {
      throw new OperationalError('pasword does not match', 400)
    }

    if (!Password.isStrong(password)) {
      throw new OperationalError(
        'password is too weak: use capital, small letter, interger and not less than 8 character',
        400,
      )
    }

    const pin = authCode(6)
    const pinExpiry = Date.now() + 1000 * 60 * 5 // 5 mins

    const existingUser = await UserRepo.getByEmail(email)

    if (existingUser) {
      existingUser.auth_code = existingUser.auth_code ?? Number(pin)
      existingUser.auth_expiry = pinExpiry
      existingUser.approved = false
      existingUser.verified = false
      await existingUser.save()

      await new Email({
        firstName: existingUser.first_name,
        lastName: existingUser.last_name,
        email: existingUser.email,
      }).sendVerifyEmail(pin)

      return existingUser.restricted()
    }

    const newUser = await new UserModel({
      email,
      mobile,
      last_name,
      first_name,
      country_code,
      auth_code: pin,
      role: 'customer',
      auth_expiry: pinExpiry,
      password: await Password.encrypt(password),
    }).save({ session })

    await new Email({
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      email: newUser.email,
    }).sendVerifyEmail(pin)

    return newUser.restricted()
  }

  private static _getPasswordResetTokenWithSession = async (
    email: string,
    session: MaybeSession,
  ) => {
    // if the sendResetPasswordToken fails, updated to user will rollback. NEAT TRICK
    const emailUser = await UserRepo.getByEmail(email)

    if (!emailUser) {
      throw new OperationalError('invalid email , user does not exist', 400)
    }

    const pin = authCode(6)

    await UserModel.findOneAndUpdate(
      {
        _id: emailUser._id,
        email: emailUser.email,
      },
      {
        auth_expiry: Date.now() + 10 * 60 * 1000, //code expires in 10 minutes
        auth_code: pin,
      },
      {
        session,
      },
    )

    const userData = {
      firstName: emailUser.first_name,
      lastName: emailUser.last_name,
      email: emailUser.email,
    }

    await new Email(userData).sendResetPasswordToken(pin)
  }

  private static _getVerificationTokenWithSession = async (
    email: string,
    session: MaybeSession,
  ) => {
    const pin = authCode(6)
    const pinExpiry = Date.now() + 1000 * 60 * 5

    const user = await UserModel.findOneAndUpdate(
      {
        email: email,
      },
      {
        verified: false,
        approved: false,
        auth_code: Number(pin),
        auth_expiry: pinExpiry,
      },
      { session },
    )

    if (user == null) {
      throw new OperationalError('either user is already verified or does not exist', 400)
    }

    const userData = {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    }

    await new Email(userData).sendVerifyEmail(pin)
  }

  // ************* Public *************

  static validateToken = async (token: unknown, type: 'access' | 'refresh') => {
    if (typeof token !== 'string') {
      throw new OperationalError('required token must be a string', 404, { valid: false })
    }

    // this throws
    const authUser = await TokenManager.decode(token, type)

    if (!authUser || typeof authUser !== 'object') {
      throw new OperationalError(`invalid ${type} token/expired`, 404, { valid: false })
    }

    return true
  }

  static refreshAccessToken = async (refreshToken: string) => {
    const authUser = await TokenManager.decode(refreshToken, 'refresh')

    return {
      accessToken: TokenManager.sign('access', authUser),
    }
  }

  static changePassword = async (data: Record<string, any>) => {
    const { email, pin, password, cpassword } = data

    if (!email || !pin || !password || !cpassword) {
      throw new OperationalError('all input are required', 400)
    }

    const pinUser = await UserModel.findOne({
      email: email,
      auth_code: Number(pin),
    })

    if (!pinUser) {
      throw new OperationalError('invalid credentials supplied', 400)
    }

    if (password !== cpassword) {
      throw new OperationalError('paswords does not match', 400)
    }

    if (Date.now() > Number(pinUser.auth_expiry)) {
      throw new OperationalError('password reset token has expired', 400)
    }

    if (!Password.isStrong(password)) {
      throw new OperationalError(
        'password is too weak, use capital & small letter, interger and not less than 8 character',
        400,
      )
    }

    await UserModel.findOneAndUpdate(
      {
        _id: pinUser._id,
        email: pinUser.email,
      },
      {
        password: await Password.encrypt(password),
        auth_code: null,
        auth_expiry: null,
      },
      {
        upsert: true,
      },
    )
  }

  static getVerificationToken = async (email: string) => {
    await withMongoDBSession(this._getVerificationTokenWithSession, email)
  }

  static getPasswordResetToken = async (email: string) => {
    await withMongoDBSession(this._getPasswordResetTokenWithSession, email)
  }

  static createPin = async (data: Record<string, string>) => {
    const { email, pin, cpin } = data

    if (!email || !pin || !cpin) {
      throw new OperationalError('onboarding user email and pins are needed to continue', 400)
    }

    if (pin !== cpin) {
      throw new OperationalError('pins do not match', 404)
    }

    const userExist = await UserModel.findOneAndUpdate({ email }, { $set: { pin } }, { new: true })

    if (userExist === null) {
      throw new OperationalError('User does not exist', 404)
    }
  }

  static createCustomer = async (data: Record<string, any>) => {
    return await withMongoDBSession(this._createCustomerWithSession, data)
  }

  static signIn = async (email: string, password: string) => {
    const userExist = await UserRepo.getByEmail(email)

    if (!userExist) {
      throw new OperationalError('user does not exist', 404)
    }

    if (userExist.suspended) {
      throw new OperationalError(
        'you have been suspended from using our services, contact the admin',
        404,
      )
    }

    //create a customer settings DB if it doesn't exist
    const userSettingDB = await SettingsModel.findOne({
      user_id: userExist._id,
    })

    if (!userSettingDB) {
      await SettingsModel.create({
        user_id: userExist._id,
        video_quality: '720p',
      })
    }

    const passVerify = await Password.compare(password, userExist.password)

    if (!passVerify) {
      throw new OperationalError('incorrect password', 404)
    }

    const pin = authCode(6)

    if (!userExist.verified) {
      // do not use session.
      await UserRepo.updateById(userExist.id, {
        auth_code: Number(pin),
        auth_expiry: Date.now() + 1000 * 60 * 5,
      })

      // TODO: Send email

      /**
       *
       */

      /**
       * await new Email({
        firstName: userExist.first_name,
        lastName: userExist.last_name,
        email: userExist.email,
      }).sendVerifyEmail(pin)
       */

      // throw new OperationalError(
      //   'user account not verified, check your email for verification code',
      //   400,
      // )
    }

    const tokenPayload = {
      id: userExist.id,
      email: userExist.email,
      role: userExist.role,
    }

    const token = TokenManager.sign('access', tokenPayload)
    const refToken = TokenManager.sign('refresh', tokenPayload)

    return {
      _id: userExist._id,
      email: userExist.email,
      role: userExist.role,
      accessToken: token,
      refreshToken: refToken,
      verificationPin: env.IS_PROD ? undefined : pin,
    }
  }

  static verifyAccount = async (email: string, token: number) => {
    const user = await UserRepo.getByEmail(email)

    if (!user) {
      throw new OperationalError('user does not exist', 400)
    }

    if (user.suspended) {
      throw new OperationalError(
        'you have been suspended from using our services, contact the admin',
        400,
      )
    }

    if (user.verified) {
      throw new OperationalError('user account is already verified', 400)
    }

    if (token != user.auth_code) {
      throw new OperationalError('invalid token', 400)
    }

    if (user.auth_expiry && Date.now() > user.auth_expiry) {
      throw new OperationalError('token has expired!', 400)
    }

    await UserRepo.updateById(user._id.toString(), {
      verified: true,
      approved: true,
      auth_code: null,
      auth_expiry: null,
    })

    const tolenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    const authToken = TokenManager.sign('access', tolenPayload)

    return {
      ...tolenPayload,
      _id: user.id,
      token: authToken,
    }
  }
}
