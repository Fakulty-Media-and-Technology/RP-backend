"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedaiService = void 0;
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
class MedaiService {
}
exports.MedaiService = MedaiService;
_a = MedaiService;
MedaiService._uploadPreviewVideo = async ({ liveId, file }, session) => {
    const upload = await media_management_1.MediaManagement.uploadAndTransacodeVideo({
        file,
        expire: undefined,
    });
    const videoUploadDoc = await new videoupload_model_1.VideoUploadModel({
        bucket: upload.Bucket,
        key: upload.Key,
        mimetype: upload.mimetype,
        size: upload.size,
        isTranscoded: upload.isTranscoded,
        parentId: liveId,
        parentType: 'live',
    }).save({ session });
    return videoUploadDoc;
};
MedaiService._uploadCreateLiveCoverPhoto = async ({ liveId, file }, session) => {
    const upload = await media_management_1.MediaManagement.store({ expire: undefined, baseDir: 'images', file });
    const coverPhoto = await new poster_model_1.PosterImageModel({
        video_id: liveId,
        bucket: upload.Bucket,
        key: upload.Key,
        parentType: 'live',
    }).save({ session });
    return coverPhoto;
};
MedaiService._processCreateLivePaymentPayment = async ({ paymentId, clientId, start, expiry }, session) => {
    if (!paymentId) {
        throw new OperationalError_1.OperationalError('PaymentId is required', 403);
    }
    const confirmPayment = await payments_model_1.PaymentModel.findOne({
        _id: paymentId,
        user_id: clientId,
        status: 'success',
        is_used: false,
    });
    if (!confirmPayment) {
        throw new OperationalError_1.OperationalError('your payment is invalid', 400);
    }
    if (confirmPayment.amount !== (0, live_1.calcLiveCharges)(start, expiry)) {
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
MedaiService._createLiveSession = async (data, session) => {
    const vclient_id = await UserRepo_1.UserRepo.getClientByRolesAndId(data.clientId, [
        'channel',
        'event',
        'podcast',
        'tvshow',
    ]);
    if (!vclient_id) {
        throw new OperationalError_1.OperationalError('assigned user not found', 400);
    }
    if (data.creatorType === 'client') {
        await _a._processCreateLivePaymentPayment({
            paymentId: data.paymentId,
            clientId: data.clientId,
            start: data.start,
            expiry: data.expiry,
        }, session);
    }
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
    const live = new lives_model_1.LiveModel({
        client_id: vclient_id._id,
        title: data.title,
        stream_key: await (0, live_1.getUniqueStreamKey)(),
        vid_class: data.vidClass,
        pg: data.pg,
        description: data.description,
        type: data.type,
        start: new Date(data.start),
        expiry: new Date(data.expiry),
        sponsored: data.sponsored,
        popular: data.popular,
        location: data.location,
        payment_id: data.paymentId,
    });
    const liveId = live._id.toString();
    const coverPhoto = await _a._uploadCreateLiveCoverPhoto({ liveId, file: data.coverPhoto }, session);
    live.coverPhoto = coverPhoto._id;
    if (data.previewVideo) {
        const vidUploadDoc = await _a._uploadPreviewVideo({ liveId, file: data.previewVideo }, session);
        live.previewVideoUpload = vidUploadDoc._id;
    }
    await live.save({ session });
    return live;
};
MedaiService.createLive = async (data) => {
    return await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._createLiveSession, data);
};
MedaiService.getVodStream = async (vidUploadId, currentUser) => {
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
MedaiService.getPhotoUrl = async (bucket, key) => {
    return await media_access_1.MediaAccess.getSignedUrl(bucket, key, 'photo');
};
MedaiService.getSubtitleUrl = async (bucket, key) => {
    return await media_access_1.MediaAccess.getSignedUrl(bucket, key, 'subtitle');
};
MedaiService.getSubtitles = async (parentId) => {
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
