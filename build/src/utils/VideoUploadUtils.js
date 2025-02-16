"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VidUploadUtils = void 0;
const userSettings_model_1 = require("../models/userSettings.model");
const media_access_1 = require("../services/media-access");
class VidUploadUtils {
}
exports.VidUploadUtils = VidUploadUtils;
_a = VidUploadUtils;
VidUploadUtils.getResSourceUrl = (videoUpload, defaultRes) => {
    if (videoUpload == null)
        return null;
    const res = videoUpload.resolutions.find(r => r.key.endsWith(`_${defaultRes}.mp4`));
    return res ? media_access_1.MediaAccess.getCloudFrontSignedUrl(res.key) : null;
};
VidUploadUtils.getUserVideoQuality = async (userId, defaultQuality = '480p') => {
    const userSetting = await userSettings_model_1.SettingsModel.findOne({ user_id: userId }).sort({ _id: -1 });
    return userSetting && userSetting.video_quality ? userSetting.video_quality : defaultQuality;
};
