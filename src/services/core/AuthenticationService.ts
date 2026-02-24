import { UserDocument, UserModel, UserSchema } from '../../models/users.model'
import { SettingsModel } from '../../models/userSettings.model'
import { UserRepo } from '../../repositories/UserRepo'
import { authCode } from '../../utils/strGen'
import Email from '../../utils/emailer'
import { TokenManager } from '../../utils/jwt'
import { OperationalError } from '../../utils/OperationalError'
import { Password } from '../../utils/Password'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import env from '../../env'
import { MulterFile, StringOrObjectId } from '../../types'
import { throwReasonIfAny } from '../../utils/promises'
import { MediaManagement } from '../media-management'
import { GetDefined } from '../../utils/GetDefined'

type Role = UserSchema['role']

interface CreateUserInput {
  data: Record<string, any>
  role: Role
  image?: Express.Multer.File
}

export class AuthenticationService {
  protected static _handleUserImageUpload = async (user: UserDocument, image?: MulterFile) => {
    if (!image) return

    const { Bucket, Key } = await MediaManagement.storeImageAndSubtitle(image)

    if (Bucket == null) {
      throw new OperationalError('could not upload photo', 500)
    }

    user.photo = {
      Bucket,
      Key,
    }
  }

  protected static _encryptPassword = async (userDocument: UserDocument, password: string) => {
    userDocument.password = await Password.encrypt(password.trim())
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

    const userDocument = new UserModel({
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
      this._encryptPassword(userDocument, password),
      this._handleUserImageUpload(userDocument, image),
    ])

    throwReasonIfAny(settled)
    await userDocument.save()
    this._autoCreateUserSettingsOnSignUp(userDocument._id)
  }

  protected static _autoCreateUserSettingsOnSignUp = async (newUserId: StringOrObjectId) => {
    try {
      await SettingsModel.create({
        user_id: newUserId,
        video_quality: '720p',
      })
    } catch (e) {
      console.error('Error in creating settings for new user', newUserId)
    }
  }

  static sendResetPin = async (email: string) => {
    const pin = authCode(4)

    const userDocument = await UserModel.findOneAndUpdate(
      {
        email: email.toLowerCase().trim(),
      },
      { $set: { pin } },
    )

    if (userDocument == null) {
      throw new OperationalError('Invalid Email', 404)
    }

    await new Email(Email.makeRecepiant(userDocument)).sendResetPin(pin)
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

    Password.checkIsStrongPasswordOrThrow(password)

    const pin = authCode(6)
    const pinExpiry = Date.now() + 1000 * 60 * 5 // 5 mins

    const userDocument = await UserRepo.getByEmail(email)

    if (userDocument) {
      userDocument.auth_code = userDocument.auth_code ?? Number(pin)
      userDocument.auth_expiry = pinExpiry
      userDocument.approved = false
      userDocument.verified = false
      await userDocument.save()
      await new Email(Email.makeRecepiant(userDocument)).sendVerifyEmail(pin)
      return userDocument.restricted()
    }

    const newUserDocument = await new UserModel({
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

    await new Email(Email.makeRecepiant(newUserDocument)).sendVerifyEmail(pin)
    return newUserDocument.restricted()
  }

  private static _getPasswordResetTokenWithSession = async (
    email: string,
    session: MaybeSession,
  ) => {
    const code = authCode(6)

    const userDocument = GetDefined.userDocument(
      await UserModel.findOneAndUpdate(
        { email },
        {
          auth_expiry: Date.now() + 10 * 60 * 1000, //code expires in 10 minutes
          auth_code: code,
        },
        {
          session,
        },
      ),
    )

    await new Email(Email.makeRecepiant(userDocument)).sendResetPasswordToken(code)
  }

  private static _getVerificationTokenWithSession = async (
    email: string,
    session: MaybeSession,
  ) => {
    const pin = authCode(6)

    const userDocument = GetDefined.userDocument(
      await UserModel.findOneAndUpdate(
        {
          email,
        },
        {
          verified: false,
          approved: false,
          auth_code: Number(pin),
          auth_expiry: Date.now() + 1000 * 60 * 5,
        },
        { session },
      ),
    )

    await new Email(Email.makeRecepiant(userDocument)).sendVerifyEmail(pin)
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
    const payload = await TokenManager.decode(refreshToken, 'refresh')
    const userDocument = GetDefined.userDocument(await UserModel.findById(payload.id))

    if (userDocument == null) {
      throw new OperationalError('Please Login', 401)
    }

    return {
      accessToken: TokenManager.sign('access', TokenManager.makePayload(userDocument)),
    }
  }

  static changePassword = async (data: Record<string, any>) => {
    const { email, pin, password, cpassword } = data

    if (!email || !pin || !password || !cpassword) {
      throw new OperationalError('all input are required', 400)
    }

    const userDocument = GetDefined.userDocument(
      await UserModel.findOne({
        email: email,
        auth_code: Number(pin),
      }),
      'Invalid credentials supplied',
    )

    Password.checkIsSameOrThrow(password, cpassword)
    Password.checkIsStrongPasswordOrThrow(password)

    if (userDocument.auth_expiry && Date.now() > Number(userDocument.auth_expiry)) {
      await userDocument.resetAuthFeilds(true)
      throw new OperationalError('password reset token has expired', 400)
    }

    userDocument.password = await Password.encrypt(password)
    await userDocument.resetAuthFeilds(true)
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

    GetDefined.userDocument(
      await UserModel.findOneAndUpdate({ email }, { $set: { pin } }, { new: true }),
    )
  }

  static createCustomer = async (data: Record<string, any>) => {
    return await withMongoDBSession(this._createCustomerWithSession, data)
  }

  protected static _sharedSigninSteps = async (email: string, password: string) => {
    const userDocument = GetDefined.userDocument(await UserRepo.getByEmail(email.toLowerCase()))

    if (!userDocument) {
      throw new OperationalError('user does not exist', 404)
    }

    userDocument.throwIfDeleted()

    if (userDocument.suspended) {
      throw new OperationalError(
        'you have been suspended from using our services, contact the admin',
        404,
      )
    }

    const passVerify = await Password.compare(password, userDocument.password)

    if (!passVerify) {
      throw new OperationalError('incorrect password', 404)
    }

    return userDocument
  }

  private static _getUserAuthPayload = (userDocument: UserDocument) => {
    const tokenPayload = TokenManager.makePayload(userDocument)
    const token = TokenManager.sign('access', tokenPayload)

    return {
      token,
      tokenPayload,
    }
  }

  static adminSignIn = async (email: string, password: string) => {
    const adminDocument = await this._sharedSigninSteps(email, password)

    if (
      !['channel', 'tvshow', 'event', 'podcast', 'admin', 'superadmin'].includes(adminDocument.role)
    ) {
      throw new OperationalError('Admin login: not available to you', 400)
    }

    return this._getUserAuthPayload(adminDocument)
  }

  static adminForceClientSignIn = async (email: string) => {
    const clientDocument = await UserModel.findOne({ email: email.toLowerCase() })

    if (clientDocument == null) {
      throw new OperationalError('Invalid email address', 404)
    }

    if (!['channel', 'tvshow', 'event', 'podcast'].includes(clientDocument.role)) {
      throw new OperationalError('Only client details can be retrived', 400)
    }

    return this._getUserAuthPayload(clientDocument)
  }

  static signIn = async (email: string, password: string) => {
    const userDocument = await this._sharedSigninSteps(email, password)

    if (userDocument.verified) {
      const payload = TokenManager.makePayload(userDocument)
      const token = TokenManager.sign('access', payload)
      const refToken = TokenManager.sign('refresh', payload)

      return {
        _id: userDocument._id,
        email: userDocument.email,
        role: userDocument.role,
        accessToken: token,
        refreshToken: refToken,
      }
    }

    const pin = authCode(6)
    await UserRepo.updateById(userDocument.id, {
      auth_code: Number(pin),
      auth_expiry: Date.now() + 1000 * 60 * 5,
    })

    await new Email({
      firstName: userDocument.first_name,
      lastName: userDocument.last_name,
      email: userDocument.email,
    }).sendVerifyEmail(pin)

    throw new OperationalError('Please check your email for your verification code', 400)
  }

  static verifyAccount = async (email: string, token: number) => {
    const userDocument = GetDefined.userDocument(await UserRepo.getByEmail(email))

    if (userDocument.suspended) {
      throw new OperationalError(
        'you have been suspended from using our services, contact the admin',
        400,
      )
    }

    if (userDocument.verified) {
      throw new OperationalError('user account is already verified', 400)
    }

    if (token != userDocument.auth_code) {
      throw new OperationalError('invalid token', 400)
    }

    if (userDocument.auth_expiry && Date.now() > userDocument.auth_expiry) {
      throw new OperationalError('token has expired!', 400)
    }

    await UserRepo.updateById(userDocument._id.toString(), {
      verified: true,
      approved: true,
      auth_code: null,
      auth_expiry: null,
    })

    const payload = TokenManager.makePayload(userDocument)
    const authToken = TokenManager.sign('access', payload)

    return {
      ...payload,
      _id: userDocument.id,
      token: authToken,
    }
  }
}
