import { SettingsModel } from '../../models/userSettings.model'
import { VideoUploadModel } from '../../models/videoupload.model'
import { LoggedInUser, MulterFile } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { MediaAccess } from '../media-access'
import { ClientSession } from 'mongoose'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { Live, LiveModel } from '../../models/lives.model'
import { PaymentModel } from '../../models/payments.model'
import { UserRepo } from '../../repositories/UserRepo'
import { calcLiveCharges, getUniqueStreamKey } from '../../utils/live'
import { MediaManagement } from '../media-management'
import { PosterImageModel } from '../../models/poster.model'
import { SubtitleModel } from '../../models/subtitle.model'
import { User, UserModel } from '../../models/users.model'
import { Password } from '../../utils/Password'
import { S3 } from '../aws/s3'
import { AuthHeaderKey } from '../../middlewares/auth'
import { throwReasonIfAny } from '../../utils/promises'

export type CreateLiveData = {
  clientId: string
  title: string
  subTitle?: string
  pg: string
  vidClass: string
  type: string
  start: string
  expiry: string
  category?: string[]
  description?: string
  location?: string
  upcoming?: boolean
  coverPhoto: Express.Multer.File
  channelLogo?: Express.Multer.File
  previewVideo?: Express.Multer.File
  sponsored?: boolean
  popular?: boolean
  paymentId?: string
  creatorType: 'admin' | 'client'
}

type UserProfileUpdate = {
  userId: string
  firstName?: string
  lastName?: string
  email?: string
  countryCode?: string
  mobile?: string
  password?: string
  prevPassword?: string
  gender?: string
  dob?: string
  role?: string
  country?: string
}

type UpdateUserProfileInput = {
  imageFile?: MulterFile
  data: UserProfileUpdate
  authType: AuthHeaderKey
}

type LiveFileUploader = (
  params: { data: CreateLiveData; live: Live },
  session: ClientSession,
) => Promise<void>

export class MediaService {
  private static _uploadLivePreviewVideo: LiveFileUploader = async ({ data, live }, session) => {
    if (!data.previewVideo) return

    const upload = await MediaManagement.uploadAndInitiateMediaConvert({
      file: data.previewVideo,
      expire: undefined,
    })

    const videoUploadDoc = await new VideoUploadModel({
      bucket: upload.Bucket,
      key: upload.Key,
      mimetype: upload.mimetype,
      size: upload.size,
      isTranscoded: upload.isTranscoded,
      parentId: live._id,
      parentType: 'live',
    }).save({ session })

    live.previewVideoUpload = videoUploadDoc._id
  }

  private static _uploadLiveChannelLogo: LiveFileUploader = async ({ data, live }, session) => {
    if (!data.channelLogo) return

    if (data.channelLogo && live.type !== 'channel') {
      throw new OperationalError('Only channles can have a channelLogo', 400)
    }

    const logoUpload = await MediaManagement.store({
      file: data.channelLogo,
      expire: undefined,
      baseDir: 'images',
    })

    const poster = new PosterImageModel({
      video_id: live._id,
      key: logoUpload.Key,
      bucket: logoUpload.Bucket,
      dimension: 'channel-logo',
      parentType: 'live',
    })

    live.channelLogo = poster._id
    await poster.save({ session })
  }

  private static _uploadLiveCoverPhoto: LiveFileUploader = async ({ data, live }, session) => {
    if (!data.coverPhoto) {
      throw new OperationalError('cover photo is required', 400)
    }
    const upload = await MediaManagement.store({
      expire: undefined,
      baseDir: 'images',
      file: data.coverPhoto,
    })

    const coverPhoto = await new PosterImageModel({
      video_id: live._id,
      bucket: upload.Bucket,
      key: upload.Key,
      parentType: 'live',
    }).save({ session })

    live.coverPhoto = coverPhoto._id
  }

  private static _checkLiveOngoinStreams = async (data: CreateLiveData) => {
    const live = await LiveModel.findById(data.clientId)

    if (live != null) {
      throw new OperationalError('Already has a live', 403)
    }

    // const [streamOngoing, scheduledStream] = await Promise.all([
    //   LiveModel.findOne({ client_id: data.clientId, active: true }),
    //   LiveModel.findOne({ client_id: data.clientId, active: false, expired: false }),
    // ])

    // if (streamOngoing) {
    //   throw new OperationalError('client has an ongoing stream', 400)
    // }

    // if (scheduledStream) {
    //   throw new OperationalError('client has a scheduled stream', 400)
    // }
  }

  private static _checkLivePayments = async (data: CreateLiveData, session: ClientSession) => {
    if (data.creatorType !== 'client') return

    if (!data.paymentId) {
      throw new OperationalError('PaymentId is required', 403)
    }

    const confirmPayment = await PaymentModel.findOne({
      _id: data.paymentId,
      user_id: data.clientId,
      status: 'success',
      is_used: false,
    })

    if (!confirmPayment) {
      throw new OperationalError('your payment is invalid', 400)
    }

    const charges = calcLiveCharges({
      start: data.start,
      expiry: data.expiry,
      currency: confirmPayment.currency,
    })

    if (confirmPayment.amount !== charges) {
      throw new OperationalError('amount must be the same as charge', 400)
    }

    await PaymentModel.findByIdAndUpdate(
      confirmPayment._id,
      {
        is_used: true,
        use_case: 'live schedule',
      },
      { session },
    )
  }

  private static _checkLiveClient = async (data: CreateLiveData) => {
    const vclient_id = await UserRepo.getClientByRolesAndId(data.clientId, [
      'channel',
      'event',
      'podcast',
      'tvshow',
    ])

    if (!vclient_id) {
      throw new OperationalError('assigned user not found', 400)
    }
  }

  private static _createLiveSession = async (data: CreateLiveData, session: ClientSession) => {
    const settled = await Promise.allSettled([
      this._checkLiveClient(data),
      this._checkLiveOngoinStreams(data),
    ])

    throwReasonIfAny(settled)

    await this._checkLivePayments(data, session)

    const live = new LiveModel({
      client_id: data.clientId,
      title: data.title,
      subTitle: data.subTitle,
      stream_key: await getUniqueStreamKey(),
      vid_class: data.vidClass,
      pg: data.pg,
      description: data.description,
      category: data.category || [],
      type: data.type,
      upcoming: data.upcoming,
      start: new Date(data.start),
      expiry: new Date(data.expiry),
      sponsored: data.sponsored,
      popular: data.popular,
      location: data.location,
      payment_id: data.paymentId,
    })

    const uploaderParams = { data, live }

    await this._uploadLiveChannelLogo(uploaderParams, session)
    await this._uploadLivePreviewVideo(uploaderParams, session)
    await this._uploadLiveCoverPhoto(uploaderParams, session)
    await live.save({ session })
  }

  static createLive = async (data: CreateLiveData) => {
    return await withMongoDBSession(this._createLiveSession, data)
  }

  static getVodStream = async (vidUploadId: string, currentUser: LoggedInUser) => {
    const vidUpload = await VideoUploadModel.findById(vidUploadId)

    if (vidUpload == null) {
      throw new OperationalError('Invalid video Upload Id', 404)
    }

    const response = {
      isTranscodedStream: vidUpload.isTranscoded,
      streamUrl: '',
    }

    if (!vidUpload.isTranscoded) {
      response.streamUrl = MediaAccess.getCloudFrontSignedUrl(vidUpload.key)
      return response
    }

    const [recentSetting] = await SettingsModel.find({ user_id: currentUser._id }).sort({
      createdAt: -1,
    })

    const vidQuality =
      recentSetting && recentSetting.video_quality ? recentSetting.video_quality : '720p'

    const vidUploadRes = vidUpload.resolutions.find(r => r.key.endsWith(`${vidQuality}.mp4`))

    if (vidUploadRes == null) {
      throw new OperationalError('something went wrong', 500)
    }

    response.streamUrl = MediaAccess.getCloudFrontSignedUrl(vidUploadRes.key)
    return response
  }

  private static _updateUserEmail = async (email: string, user: User) => {
    if (email === user.email) return

    const existOnAnother = await UserModel.findOne({
      _id: { $ne: user._id },
      email,
    })

    if (existOnAnother)
      throw new OperationalError(`${email} is associated with other documents`, 403)

    // do other neccessary stuff like set auth pin and stuff

    user.email = email
  }

  private static _handleUpdateUserPassword = async (
    prevPass: string,
    newPass: string,
    user: User,
  ) => {
    if (!Password.isStrong(newPass)) {
      throw new OperationalError('new password is not strong enough', 400)
    }

    const isSamePassword = await Password.compare(prevPass, user.password)

    if (!isSamePassword) {
      throw new OperationalError('previous password did not match user password', 403)
    }

    if (newPass === prevPass) return

    user.password = await Password.encrypt(newPass)
  }

  private static _updateUserProfileImage = async (imageFile: MulterFile, user: User) => {
    let prevKey: string | null | undefined = null
    let prevBucket: string | null | undefined = null

    const { Bucket, Key, mimetype } = await MediaManagement.store({
      file: imageFile,
      expire: undefined,
      baseDir: 'images',
    })

    if (!Bucket) {
      throw new OperationalError('error updating image', 500)
    }

    prevKey = user.photo?.Key
    prevBucket = user.photo?.Bucket

    user.photo = {
      Bucket,
      Key,
      ContentType: mimetype,
    }

    return {
      prevKey,
      prevBucket,
    }
  }

  static updateUserProfile = async ({ imageFile, data, authType }: UpdateUserProfileInput) => {
    if (data.role && authType !== 'admin-auth' && authType !== 'superadmin-auth') {
      throw new OperationalError('only admins can update role', 403)
    }

    const user = await UserModel.findById(data.userId)

    let prevPhotoKey: string | null | undefined = null
    let prevPhotoBucket: string | null | undefined = null

    if (user == null) {
      throw new OperationalError('invalid userId', 404)
    }

    if (imageFile) {
      const { prevBucket, prevKey } = await this._updateUserProfileImage(imageFile, user)
      prevPhotoKey = prevKey
      prevPhotoBucket = prevBucket
    }

    if (data.password && data.prevPassword)
      await this._handleUpdateUserPassword(data.prevPassword, data.password, user)

    if (data.email) await this._updateUserEmail(data.email, user)

    user.first_name = data.firstName || user.first_name
    user.last_name = data.lastName || user.last_name
    user.country_code = data.countryCode || user.country_code
    user.mobile = data.mobile || user.mobile
    user.country = data.country || user.country
    user.gender = (data.gender as any) || user.gender
    user.dob = data.dob ? new Date(data.dob) : user.dob

    await user.save()

    if (prevPhotoBucket && prevPhotoKey) {
      S3.deleteObject(prevPhotoKey, prevPhotoBucket).catch(() => {
        console.error(
          `Error deleting key: ${prevPhotoKey} in bucket: ${prevPhotoBucket} from s3 on MediaService.updateUserProfile`,
        )
      })
    }
  }

  static getPhotoUrl = async (bucket: string, key: string) => {
    return await MediaAccess.getSignedUrl(bucket, key, 'photo')
  }

  static getSubtitleUrl = async (bucket: string, key: string) => {
    return await MediaAccess.getSignedUrl(bucket, key, 'subtitle')
  }

  static getSubtitles = async (parentId: string) => {
    const subtitles = await SubtitleModel.find({ video_id: parentId })

    return await Promise.all(
      subtitles.map(async subtitle => {
        return {
          ...subtitle.toObject(),
          src: await MediaAccess.getSignedUrl(subtitle.bucket, subtitle.key, 'subtitle'),
          createdAt: undefined,
          updatedAt: undefined,
          video_id: undefined,
          parentType: undefined,
          __v: undefined,
        }
      }),
    )
  }
}
