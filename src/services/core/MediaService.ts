import { SettingsModel } from "../../models/userSettings.model"
import { VideoUploadModel } from "../../models/videoupload.model"
import { LoggedInUser } from "../../types"
import { OperationalError } from "../../utils/OperationalError"
import { MediaAccess } from "../media-access"

export class MedaiService {
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

  static getPhotoUrl = async (bucket: string, key: string) => {
    return await MediaAccess.getSignedUrl(bucket, key, 'photo')
  }

  static getSubtitleUrl = async (bucket: string, key: string) => {
    return await MediaAccess.getSignedUrl(bucket, key, 'subtitle')
  }
}