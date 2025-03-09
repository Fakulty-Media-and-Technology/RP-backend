"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveMediaSourcesUtils = void 0;
const media_access_1 = require("../services/media-access");
const promises_1 = require("./promises");
const VideoUploadUtils_1 = require("./VideoUploadUtils");
class LiveMediaSourcesUtils {
}
exports.LiveMediaSourcesUtils = LiveMediaSourcesUtils;
_a = LiveMediaSourcesUtils;
LiveMediaSourcesUtils.resolveSources = async (lives, quality) => {
    const settled = await Promise.allSettled(lives.map(async (live) => {
        Object.assign(live, {
            previewVideo: VideoUploadUtils_1.VidUploadUtils.getResSourceUrl(live.previewVideoUploadDoc, quality),
            coverPhoto: live.coverPhoto
                ? await media_access_1.MediaAccess.getSignedUrl(live.coverPhoto.bucket, live.coverPhoto.key, 'photo')
                : null,
            channelLogo: live.channelLogo
                ? await media_access_1.MediaAccess.getSignedUrl(live.channelLogo.bucket, live.channelLogo.key, 'photo')
                : null,
            previewVideoUploadDoc: undefined,
        });
        return live;
    }));
    return (0, promises_1.getPromiseAllFulfilledResults)(settled);
};
