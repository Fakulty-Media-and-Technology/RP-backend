"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerMediaController = void 0;
const cloudfront_signer_1 = require("@aws-sdk/cloudfront-signer");
const client_s3_1 = require("@aws-sdk/client-s3");
const catchAsync_1 = require("../../utils/catchAsync");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
const videos_model_1 = require("../../models/videos.model");
const LiveRepo_1 = require("../../repositories/LiveRepo");
const denyGuestUser_1 = require("../../utils/denyGuestUser");
const media_management_1 = require("../../services/media-management");
const userSettings_model_1 = require("../../models/userSettings.model");
const OperationalError_1 = require("../../utils/OperationalError");
const media_access_1 = require("../../services/media-access");
const env_1 = __importDefault(require("../../env"));
const s3Client = new client_s3_1.S3Client({
    region: env_1.default.S3REGION,
    credentials: {
        accessKeyId: env_1.default.S3ACCESS_KEY,
        secretAccessKey: env_1.default.S3SECRET_KEY,
    },
});
class CustomerMediaController {
}
exports.CustomerMediaController = CustomerMediaController;
_a = CustomerMediaController;
CustomerMediaController._getLiveEventsWithPhotoUrl = async (filterQuery) => {
    const liveEvents = await LiveRepo_1.LiveRepo.getSelectedLive(filterQuery);
    const settledResults = await Promise.allSettled(liveEvents.map(async (event) => {
        const signedUrl = await (0, media_access_1.readPhotos)(event.cover_photo.Bucket, event.cover_photo.Key);
        const photo_url = typeof signedUrl !== 'string' && signedUrl.status == 400 ? 'no picture' : signedUrl;
        const result = {
            liveEvent: event,
            photo_url,
        };
        return result;
    }));
    const results = [];
    settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
            results.push(result.value);
        }
    });
    return results;
};
CustomerMediaController._mergeEventAndPhotoUrl = (results) => {
    return results.map(result => ({ ...result.liveEvent, photo_url: result.photo_url }));
};
CustomerMediaController.uploadImageRoute = catchAsync_1.Catch.async(async (req, res) => {
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    const { fileName, fileHandle } = req.body;
    const image = await (0, media_management_1.uploadImage)(req, fileHandle, fileName);
    (0, responder_1.sendResponse)({
        res,
        data: image,
        message: 'image uploaded',
    });
});
CustomerMediaController.customerGetPhotoUrl = catchAsync_1.Catch.async(async (req, res) => {
    // const user = GetDefined.loggedInUser(req.user)
    // denyGuestUser(user)
    const { bucket, key } = req.body;
    (0, responder_1.sendResponse)({
        res,
        data: await (0, media_access_1.readPhotos)(bucket, key),
        message: 'image uploaded',
    });
});
CustomerMediaController.vodStream = catchAsync_1.Catch.async(async (req, res) => {
    const { bucket, key } = req.body;
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    const transPath = `s3://reeplay/transcode/${key.split('/').slice(1).join('/')}`;
    const commandInput = {
        Bucket: bucket,
        Prefix: `transcode/${key.split('/').slice(1).join('/')}/`,
        MaxKeys: 1,
    };
    const command = new client_s3_1.ListObjectsV2Command(commandInput);
    const data = await s3Client.send(command);
    if (data.Contents == null) {
        console.dir({ errorMessage: '🛑Error fetching S3 data objects', data }, { depth: null });
        throw new OperationalError_1.OperationalError('Could not list data contents', 500);
    }
    const checkTranscodedFolder = data.Contents.length > 0;
    if (checkTranscodedFolder != true) {
        const filePath = `s3://reeplay/${key}`;
        await (0, media_access_1.createTranscodingJob)(filePath, transPath);
        throw new OperationalError_1.OperationalError('Oops, check back in few minutes, wait while the video is being transcoded', 500);
    }
    const user_resolution = await userSettings_model_1.SettingsModel.findOne({ user_id: user.id });
    const userRes = user_resolution?.video_quality || '480p';
    const url = `${process.env.CFSDISTRIBUTION}/${key
        .split('/')
        .slice(1)
        .join('/')}/${key.split('/').slice(1).join('/')}_${userRes}.mp4`;
    const privateKey = env_1.default.CFS_PRIVATE_KEY.replace(/\\n/g, '\n');
    const expirationDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    // access transcoded files with cloudfront
    const signedUrl = (0, cloudfront_signer_1.getSignedUrl)({
        url: url,
        keyPairId: env_1.default.KEY_PAIR_ID,
        dateLessThan: expirationDate.toISOString(),
        privateKey: privateKey,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'video streaming',
        data: {
            video_content: signedUrl,
        },
    });
});
CustomerMediaController.getFeaturedVods = catchAsync_1.Catch.async(async (_, res) => {
    const vods = await videos_model_1.VideoModel.find({ featured: true });
    // for (let vod of vods) {
    //      if (
    //           vod.cover_photo &&
    //           vod.cover_photo.Bucket &&
    //           vod.cover_photo.Key
    //      ) {
    //           const signedUrl = await readPhotos(
    //                vod.cover_photo.Bucket,
    //                vod.cover_photo.Key
    //           );
    //           vod.photo_url =
    //                signedUrl.status == 400 ? "no picture" : signedUrl;
    //      } else {
    //           vod.photo_url = "no picture";
    //      }
    // }
    (0, responder_1.sendResponse)({
        res,
        data: vods,
        message: 'featured contents fetched successful',
    });
});
CustomerMediaController.likeVideo = catchAsync_1.Catch.async(async (req, res) => {
    const streamId = req.params.id;
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    const resLikes = await videos_model_1.VideoModel.findById(streamId);
    if (resLikes == null) {
        throw new OperationalError_1.OperationalError('Could not find video by streamId', 404);
    }
    if (resLikes.likes.includes(user._id.toString())) {
        throw new OperationalError_1.OperationalError('user already liked', 400);
    }
    await videos_model_1.VideoModel.findByIdAndUpdate(streamId, {
        $push: {
            likes: user._id,
        },
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'video liked',
    });
});
CustomerMediaController.userLikedVideo = catchAsync_1.Catch.async(async (req, res) => {
    const streamId = req.params.id;
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    const resLikes = await videos_model_1.VideoModel.findById(streamId);
    if (resLikes == null) {
        throw new OperationalError_1.OperationalError('Could not find video by streamId', 404);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'check user liked',
        data: {
            user_liked: resLikes.likes.includes(user.id),
        },
    });
});
CustomerMediaController.unLikeVideo = catchAsync_1.Catch.async(async (req, res) => {
    const streamId = req.params.id;
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    const vod = await videos_model_1.VideoModel.findOneAndUpdate({
        _id: streamId,
        likes: user.id,
    }, {
        $pull: {
            likes: user.id,
        },
    });
    if (vod === null) {
        throw new OperationalError_1.OperationalError('user did not like the video or video does not exist', 404);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'video unliked',
    });
});
CustomerMediaController.getLiveEvents = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched',
    });
});
CustomerMediaController.getLiveEventsFeatured = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        featured: true,
    });
    (0, responder_1.sendResponse)({
        res,
        data: (liveEvents),
        message: 'live featured events fetched',
    });
});
CustomerMediaController.getLiveEventsSponsored = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        sponsored: true,
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'sponsored live events fetched',
    });
});
CustomerMediaController.getLiveEventsChannels = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'channel',
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched: channels',
    });
});
CustomerMediaController.getLiveEventsChannelsPop = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'channel',
        popular: true,
    });
    (0, responder_1.sendResponse)({
        res,
        data: (liveEvents),
        message: 'live events fetched: popular',
    });
});
CustomerMediaController.getLiveEventsEven = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'events',
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched: events',
    });
});
CustomerMediaController.getLiveEventsEvenPop = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'events',
        popular: true,
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched: popular events',
    });
});
CustomerMediaController.getLiveEventsTvshow = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'tvshow',
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched: tvshow',
    });
});
CustomerMediaController.getLiveEventsTvshowPop = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'tvshow',
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched: tvshow popular',
    });
});
CustomerMediaController.getLiveEventsSports = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'sports',
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched: sports',
    });
});
CustomerMediaController.getLiveEventsSportsPop = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'sports',
        popular: true,
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched: sports popular',
    });
});
CustomerMediaController.getLiveEventsPodcast = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'podcast',
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched: podcast',
    });
});
CustomerMediaController.getLiveEventsPodcastPop = catchAsync_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'podcast',
        popular: true,
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched: podcast popular',
    });
});
CustomerMediaController.streamLiveEvent = catchAsync_1.Catch.async(async (req, res) => {
    const streamId = req.params.id;
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        _id: streamId,
        expired: false,
    });
    if (liveEvents.length === 0) {
        throw new OperationalError_1.OperationalError('there are no live events', 404);
    }
    const firstLiveEvent = liveEvents[0].liveEvent;
    const stream_url = `${env_1.default.RP_HLSURL}${firstLiveEvent.stream_key}/index.m3u8`;
    firstLiveEvent.stream_key = null;
    await firstLiveEvent.save();
    const data = {
        live_data: firstLiveEvent,
        url: stream_url,
    };
    (0, responder_1.sendResponse)({
        res,
        data,
        message: 'live events fetched',
    });
});
