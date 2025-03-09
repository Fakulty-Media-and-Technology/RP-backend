"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const userSettings_model_1 = require("../../models/userSettings.model");
const videoupload_model_1 = require("../../models/videoupload.model");
const OperationalError_1 = require("../../utils/OperationalError");
const media_access_1 = require("../media-access");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
const lives_model_1 = require("../../models/lives.model");
const payments_model_1 = require("../../models/payments.model");
const UserRepo_1 = require("../../repositories/UserRepo");
const live_1 = require("../../utils/live");
const media_management_1 = require("../media-management");
const poster_model_1 = require("../../models/poster.model");
const subtitle_model_1 = require("../../models/subtitle.model");
const users_model_1 = require("../../models/users.model");
const Password_1 = require("../../utils/Password");
const s3_1 = require("../aws/s3");
class MediaService {
}
exports.MediaService = MediaService;
_a = MediaService;
MediaService._uploadLivePreviewVideo = async ({ data, live }, session) => {
    if (!data.previewVideo)
        return;
    const upload = await media_management_1.MediaManagement.uploadAndTransacodeVideo({
        file: data.previewVideo,
        expire: undefined,
    });
    const videoUploadDoc = await new videoupload_model_1.VideoUploadModel({
        bucket: upload.Bucket,
        key: upload.Key,
        mimetype: upload.mimetype,
        size: upload.size,
        isTranscoded: upload.isTranscoded,
        parentId: live._id,
        parentType: 'live',
    }).save({ session });
    live.previewVideoUpload = videoUploadDoc._id;
};
MediaService._uploadLiveChannelLogo = async ({ data, live }, session) => {
    if (!data.channelLogo)
        return;
    if (data.channelLogo && live.type !== 'channel') {
        throw new OperationalError_1.OperationalError('Only channles can have a channelLogo', 400);
    }
    const logoUpload = await media_management_1.MediaManagement.store({
        file: data.channelLogo,
        expire: undefined,
        baseDir: 'images',
    });
    const poster = new poster_model_1.PosterImageModel({
        video_id: live._id,
        key: logoUpload.Key,
        bucket: logoUpload.Bucket,
        dimension: 'channel-logo',
        parentType: 'live',
    });
    live.channelLogo = poster._id;
    await poster.save({ session });
};
MediaService._uploadLiveCoverPhoto = async ({ data, live }, session) => {
    if (!data.coverPhoto) {
        throw new OperationalError_1.OperationalError('cover photo is required', 400);
    }
    const upload = await media_management_1.MediaManagement.store({
        expire: undefined,
        baseDir: 'images',
        file: data.coverPhoto,
    });
    const coverPhoto = await new poster_model_1.PosterImageModel({
        video_id: live._id,
        bucket: upload.Bucket,
        key: upload.Key,
        parentType: 'live',
    }).save({ session });
    live.coverPhoto = coverPhoto._id;
};
MediaService._checkLiveOngoinStreams = async (data) => {
    const [streamOngoing, scheduledStream] = await Promise.all([
        lives_model_1.LiveModel.findOne({ client_id: data.clientId, active: true }),
        lives_model_1.LiveModel.findOne({ client_id: data.clientId, active: false, expired: false }),
    ]);
    if (streamOngoing) {
        throw new OperationalError_1.OperationalError('client has an ongoing stream', 400);
    }
    if (scheduledStream) {
        throw new OperationalError_1.OperationalError('client has a scheduled stream', 400);
    }
};
MediaService._checkLivePayments = async (data, session) => {
    if (data.creatorType !== 'client')
        return;
    if (!data.paymentId) {
        throw new OperationalError_1.OperationalError('PaymentId is required', 403);
    }
    const confirmPayment = await payments_model_1.PaymentModel.findOne({
        _id: data.paymentId,
        user_id: data.clientId,
        status: 'success',
        is_used: false,
    });
    if (!confirmPayment) {
        throw new OperationalError_1.OperationalError('your payment is invalid', 400);
    }
    if (confirmPayment.amount !== (0, live_1.calcLiveCharges)(data.start, data.expiry)) {
        throw new OperationalError_1.OperationalError('payment made does not match charges', 400);
    }
    const updatedPayment = await payments_model_1.PaymentModel.findByIdAndUpdate(confirmPayment._id, {
        is_used: true,
        use_case: 'live schedule',
    }, { session });
    if (updatedPayment == null) {
        throw new OperationalError_1.OperationalError('could not update payment', 500);
    }
};
MediaService._checkLiveClient = async (data) => {
    const vclient_id = await UserRepo_1.UserRepo.getClientByRolesAndId(data.clientId, [
        'channel',
        'event',
        'podcast',
        'tvshow',
    ]);
    if (!vclient_id) {
        throw new OperationalError_1.OperationalError('assigned user not found', 400);
    }
};
MediaService._createLiveSession = async (data, session) => {
    await _a._checkLiveClient(data);
    await _a._checkLivePayments(data, session);
    await _a._checkLiveOngoinStreams(data);
    const live = new lives_model_1.LiveModel({
        client_id: data.clientId,
        title: data.title,
        stream_key: await (0, live_1.getUniqueStreamKey)(),
        vid_class: data.vidClass,
        pg: data.pg,
        description: data.description,
        type: data.type,
        upcoming: data.upcoming,
        start: new Date(data.start),
        expiry: new Date(data.expiry),
        sponsored: data.sponsored,
        popular: data.popular,
        location: data.location,
        payment_id: data.paymentId,
    });
    const uploaderParams = { data, live };
    await _a._uploadLiveChannelLogo(uploaderParams, session);
    await _a._uploadLivePreviewVideo(uploaderParams, session);
    await _a._uploadLiveCoverPhoto(uploaderParams, session);
    await live.save({ session });
    return live;
};
MediaService.createLive = async (data) => {
    return await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._createLiveSession, data);
};
MediaService.getVodStream = async (vidUploadId, currentUser) => {
    const vidUpload = await videoupload_model_1.VideoUploadModel.findById(vidUploadId);
    if (vidUpload == null) {
        throw new OperationalError_1.OperationalError('Invalid video Upload Id', 404);
    }
    const response = {
        isTranscodedStream: vidUpload.isTranscoded,
        streamUrl: '',
    };
    if (!vidUpload.isTranscoded) {
        response.streamUrl = media_access_1.MediaAccess.getCloudFrontSignedUrl(vidUpload.key);
        return response;
    }
    const [recentSetting] = await userSettings_model_1.SettingsModel.find({ user_id: currentUser._id }).sort({
        createdAt: -1,
    });
    const vidQuality = recentSetting && recentSetting.video_quality ? recentSetting.video_quality : '720p';
    const vidUploadRes = vidUpload.resolutions.find(r => r.key.endsWith(`${vidQuality}.mp4`));
    if (vidUploadRes == null) {
        throw new OperationalError_1.OperationalError('something went wrong', 500);
    }
    response.streamUrl = media_access_1.MediaAccess.getCloudFrontSignedUrl(vidUploadRes.key);
    return response;
};
MediaService._updateUserEmail = async (email, user) => {
    if (email === user.email)
        return;
    const existOnAnother = await users_model_1.UserModel.findOne({
        _id: { $ne: user._id },
        email,
    });
    if (existOnAnother)
        throw new OperationalError_1.OperationalError(`${email} is associated with other documents`, 403);
    // do other neccessary stuff like set auth pin and stuff
    user.email = email;
};
MediaService._handleUpdateUserPassword = async (prevPass, newPass, user) => {
    if (!Password_1.Password.isStrong(newPass)) {
        throw new OperationalError_1.OperationalError('new password is not strong enough', 400);
    }
    const isSamePassword = await Password_1.Password.compare(prevPass, user.password);
    if (!isSamePassword) {
        throw new OperationalError_1.OperationalError('previous password did not match user password', 403);
    }
    if (newPass === prevPass)
        return;
    user.password = await Password_1.Password.encrypt(newPass);
};
MediaService._updateUserProfileImage = async (imageFile, user) => {
    let prevKey = null;
    let prevBucket = null;
    const { Bucket, Key, mimetype } = await media_management_1.MediaManagement.store({
        file: imageFile,
        expire: undefined,
        baseDir: 'images',
    });
    if (!Bucket) {
        throw new OperationalError_1.OperationalError('error updating image', 500);
    }
    prevKey = user.photo?.Key;
    prevBucket = user.photo?.Bucket;
    user.photo = {
        Bucket,
        Key,
        ContentType: mimetype,
    };
    return {
        prevKey,
        prevBucket,
    };
};
MediaService.updateUserProfile = async ({ imageFile, data, authType }) => {
    if (data.role && authType !== 'admin-auth' && authType !== 'superadmin-auth') {
        throw new OperationalError_1.OperationalError('only admins can update role', 403);
    }
    const user = await users_model_1.UserModel.findById(data.userId);
    let prevPhotoKey = null;
    let prevPhotoBucket = null;
    if (user == null) {
        throw new OperationalError_1.OperationalError('invalid userId', 404);
    }
    if (imageFile) {
        const { prevBucket, prevKey } = await _a._updateUserProfileImage(imageFile, user);
        prevPhotoKey = prevKey;
        prevPhotoBucket = prevBucket;
    }
    if (data.password && data.prevPassword)
        await _a._handleUpdateUserPassword(data.prevPassword, data.password, user);
    if (data.email)
        await _a._updateUserEmail(data.email, user);
    user.first_name = data.firstName || user.first_name;
    user.last_name = data.lastName || user.last_name;
    user.country_code = data.countryCode || user.country_code;
    user.mobile = data.mobile || user.mobile;
    user.country = data.country || user.country;
    user.gender = data.gender || user.gender;
    user.dob = data.dob ? new Date(data.dob) : user.dob;
    await user.save();
    if (prevPhotoBucket && prevPhotoKey) {
        s3_1.S3.deleteObject(prevPhotoKey, prevPhotoBucket).catch(() => {
            console.error(`Error deleting key: ${prevPhotoKey} in bucket: ${prevPhotoBucket} from s3 on MediaService.updateUserProfile`);
        });
    }
};
MediaService.getPhotoUrl = async (bucket, key) => {
    return await media_access_1.MediaAccess.getSignedUrl(bucket, key, 'photo');
};
MediaService.getSubtitleUrl = async (bucket, key) => {
    return await media_access_1.MediaAccess.getSignedUrl(bucket, key, 'subtitle');
};
MediaService.getSubtitles = async (parentId) => {
    const subtitles = await subtitle_model_1.SubtitleModel.find({ video_id: parentId });
    return await Promise.all(subtitles.map(async (subtitle) => {
        return {
            ...subtitle.toObject(),
            src: await media_access_1.MediaAccess.getSignedUrl(subtitle.bucket, subtitle.key, 'subtitle'),
            createdAt: undefined,
            updatedAt: undefined,
            video_id: undefined,
            parentType: undefined,
            __v: undefined,
        };
    }));
};
