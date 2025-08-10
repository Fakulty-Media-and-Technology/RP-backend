import { Settings, SettingsModel } from '../models/userSettings.model'
import { MediaAccess } from '../services/media-access'
import { Resolution } from '../types/movie'

export type VidRes = NonNullable<Settings['video_quality']>

export class VidUploadUtils {
  static getResSourceUrl = (
    videoUpload: { resolutions: Resolution[] } | undefined | null,
    _: VidRes,
  ) => {
    if (videoUpload == null) {
      return null
    }

    const res = videoUpload.resolutions.find(r => r.key.endsWith(`_720p.mp4`))
    // const res = videoUpload.resolutions.find(r => r.key.endsWith(`_${defaultRes}.mp4`))
    // console.dir(JSON.parse(JSON.stringify({ videoUpload, res, defaultRes })), { depth: null })
    return res ? MediaAccess.getCloudFrontSignedUrl(res.key) : null
  }

  static getUserVideoQuality = async (userId: string, defaultQuality: VidRes = '480p') => {
    const userSetting = await SettingsModel.findOne({ user_id: userId }).sort({ _id: -1 })
    return userSetting && userSetting.video_quality ? userSetting.video_quality : defaultQuality
  }
}
