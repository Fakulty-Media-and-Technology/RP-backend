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
import { UpdateQuery } from 'mongoose'

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

type UserUpdate = UpdateQuery<UserSchema>

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
      response.streamUrl = MediaAccess.getSignedVideoURL(vidUpload.key)
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

    response.streamUrl = MediaAccess.getSignedVideoURL(vidUploadRes.key)
    return response
  }

  private static _updateUserEmail = async (email: string, userDocument: UserDocument) => {
    if (email === userDocument.email) {
      return
    }

    const existOnAnother = await UserModel.findOne({
      _id: { $ne: userDocument._id },
      email,
    })

    if (existOnAnother)
      throw new OperationalError(`${email} is associated with other documents`, 403)

    // do other neccessary stuff like set auth pin and stuff
    userDocument.email = email
  }

  private static _handleUpdateUserPassword = async (
    prevPass: string,
    newPass: string,
    userDocument: UserDocument,
  ) => {
    if (!Password.isStrong(newPass)) {
      throw new OperationalError('new password is not strong enough', 400)
    }

    const isSamePassword = await Password.compare(prevPass, userDocument.password)

    if (!isSamePassword) {
      throw new OperationalError('previous password did not match user password', 403)
    }

    if (newPass === prevPass) return

    userDocument.password = await Password.encrypt(newPass)
  }

  private static _updateUserProfileImage = async (
    imageFile: MulterFile,
    userDocument: UserDocument,
  ) => {
    const { Bucket, Key } = await MediaManagement.storeImage(imageFile)

    if (!Bucket) {
      throw new OperationalError('error updating image', 500)
    }

    const previousPhoto = userDocument.photo

    userDocument.photo = {
      Bucket,
      Key,
    }

    return {
      previousPhoto,
    }
  }

  static updateUserProfile = async ({ imageFile, data, authType }: UpdateUserProfileInput) => {
    if (data.role && authType !== 'admin-auth' && authType !== 'superadmin-auth') {
      throw new OperationalError('only admins can update role', 403)
    }

    const userDocument = await UserModel.findById(data.userId)

    if (userDocument == null) {
      throw new OperationalError('invalid userId', 404)
    }

    await userDocument.save()

    if (imageFile) {
      const { previousPhoto } = await this._updateUserProfileImage(imageFile, userDocument)

      previousPhoto &&
        MediaManagement.deleteObject(previousPhoto.Key, previousPhoto.Bucket).catch(() => {
          console.error(`Error deleting key: ${previousPhoto.Key} in image bucket`)
        })
    }

    if (data.password && data.prevPassword)
      await this._handleUpdateUserPassword(data.prevPassword, data.password, userDocument)

    if (data.email) {
      await this._updateUserEmail(data.email, userDocument)
    }

    userDocument.first_name = data.firstName || userDocument.first_name
    userDocument.last_name = data.lastName || userDocument.last_name
    userDocument.country_code = data.countryCode || userDocument.country_code
    userDocument.mobile = data.mobile || userDocument.mobile
    userDocument.country = data.country || userDocument.country
    userDocument.gender = (data.gender as any) || userDocument.gender
    userDocument.dob = data.dob ? new Date(data.dob) : userDocument.dob
    await userDocument.save()
  }

  static getPhotoUrl = async (_: string, key: string) => {
    return MediaAccess.getImageURL(key)
  }

  static getSubtitleUrl = async (_: string, key: string) => {
    return await MediaAccess.getSubtitleURL(key)
  }

  static getSubtitles = async (parentId: string) => {
    const subtitles = await SubtitleModel.find({ video_id: parentId })

    return await Promise.all(
      subtitles.map(async subtitle => {
        return {
          ...subtitle.toObject(),
          src: await MediaAccess.getSubtitleURL(subtitle.key),
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
