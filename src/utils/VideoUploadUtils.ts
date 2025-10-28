import { Settings, SettingsModel } from '../models/userSettings.model'
import { MediaAccess } from '../services/media-access'
import { Resolution } from '../types/movie'

export type VideoQuality = NonNullable<Settings['video_quality']>

export class VidUploadUtils {
  static getResSourceUrl = (
    videoUpload: { resolutions: Resolution[] } | undefined | null,
    quality: VideoQuality,
    signKey = MediaAccess.getSignedVideoURL,
  ) => {
    if (videoUpload == null) return null
    const nQuality = quality.replace('p', '')
    const res = videoUpload.resolutions.find(r => r.resolution.startsWith(nQuality))
    return res?.key ? signKey(res.key) : null
  }

  static getUserVideoQuality = async (userId: string, defaultQuality: VideoQuality = '480p') => {
    const userSetting = await SettingsModel.findOne({ user_id: userId }).sort({ _id: -1 })
    return userSetting?.video_quality ?? defaultQuality
  }
}
