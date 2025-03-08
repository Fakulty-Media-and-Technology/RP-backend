"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoUtils = void 0;
const media_access_1 = require("../services/media-access");
class PhotoUtils {
}
exports.PhotoUtils = PhotoUtils;
_a = PhotoUtils;
PhotoUtils.fetchUserAggrResPhoto = async (user) => {
    Object.assign(user, {
        photo: user.photo
            ? await media_access_1.MediaAccess.getSignedUrl(user.photo.Bucket, user.photo.Key, 'photo')
            : null,
    });
    return user;
};
