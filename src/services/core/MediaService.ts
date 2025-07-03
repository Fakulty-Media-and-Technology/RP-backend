import { SettingsModel } from '../../models/userSettings.model'
import { VideoUploadModel } from '../../models/videoupload.model'
import { LoggedInUser, MulterFile } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { MediaAccess } from '../media-access'

import { MediaManagement } from '../media-management'
import { SubtitleModel } from '../../models/subtitle.model'
import { UserSchema, UserModel, UserDocument } from '../../models/users.model'
import { Password } from '../../utils/Password'
import { S3 } from '../aws/s3'
import { AuthHeaderKey } from '../../middlewares/auth'

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

export class MediaService {
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

  private static _updateUserEmail = async (email: string, user: UserDocument) => {
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
    user: UserSchema,
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

  private static _updateUserProfileImage = async (imageFile: MulterFile, user: UserSchema) => {
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
