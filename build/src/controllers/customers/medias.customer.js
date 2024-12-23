"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerMediaController = void 0;
const cloudfront_signer_1 = require("@aws-sdk/cloudfront-signer");
const client_s3_1 = require("@aws-sdk/client-s3");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
const videos_model_1 = require("../../models/videos.model");
const LiveRepo_1 = require("../../repositories/LiveRepo");
const denyGuestUser_1 = require("../../utils/denyGuestUser");
const userSettings_model_1 = require("../../models/userSettings.model");
const OperationalError_1 = require("../../utils/OperationalError");
const env_1 = __importDefault(require("../../env"));
const media_management_1 = require("../../services/media-management");
const media_access_1 = require("../../services/media-access");
const utils_1 = require("../../services/aws/utils");
const mediaConvert_1 = require("../../services/aws/mediaConvert");
class CustomerMediaController {
}
exports.CustomerMediaController = CustomerMediaController;
_a = CustomerMediaController;
CustomerMediaController._mergeEventAndPhotoUrl = (results) => {
    return results.map(result => ({ ...result.liveEvent, photo_url: result.photo_url }));
};
CustomerMediaController.uploadImageRoute = Catch_1.Catch.async(async (req, res) => {
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    // const { fileName, fileHandle } = req.body
    if (!req.body.file) {
        throw new OperationalError_1.OperationalError('Upload an image', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        data: await media_management_1.MediaManagement.uploadImage(req.body.file),
        message: 'image uploaded',
    });
});
CustomerMediaController.customerGetPhotoUrl = Catch_1.Catch.async(async (req, res) => {
    // const user = GetDefined.loggedInUser(req.user)
    // denyGuestUser(user)
    const { bucket, key } = req.body;
    (0, responder_1.sendResponse)({
        res,
        data: await media_access_1.MediaAccess.getSignedUrl(bucket, key, 'photo'),
        message: 'image uploaded',
    });
});
CustomerMediaController.vodStream = Catch_1.Catch.async(async (req, res) => {
    const { bucket, key } = req.body;
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    // const transPath = `s3://reeplay/transcode/${key.split('/').slice(1).join('/')}`
    const transPath = `${utils_1.AwsUtils.buckets.transcodeOutput}/${key}`;
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket: utils_1.AwsUtils.buckets.s3Input,
        Prefix: `transcode/${key.split('/').slice(1).join('/')}/`,
        MaxKeys: 1,
    });
    const data = await utils_1.AwsUtils.clients.s3.send(command);
    if (data.Contents == null) {
        console.dir({ errorMessage: '🛑Error fetching S3 data objects', data }, { depth: null });
        throw new OperationalError_1.OperationalError('Could not list data contents', 500);
    }
    const checkTranscodedFolder = data.Contents.length > 0;
    if (checkTranscodedFolder != true) {
        await mediaConvert_1.MediaConvert.transcode(key);
        throw new OperationalError_1.OperationalError('Oops, check back in few minutes, wait while the video is being transcoded', 500);
    }
    const user_resolution = await userSettings_model_1.SettingsModel.findOne({ user_id: user.id });
    const userRes = user_resolution?.video_quality || '480p';
    const url = `${env_1.default.CFSDISTRIBUTION}/${key
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
CustomerMediaController.getFeaturedVods = Catch_1.Catch.async(async (_, res) => {
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
// ***************** likes ************************ //
CustomerMediaController.likeVideo = Catch_1.Catch.async(async (req, res) => {
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
CustomerMediaController.userLikedVideo = Catch_1.Catch.async(async (req, res) => {
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
CustomerMediaController.unLikeVideo = Catch_1.Catch.async(async (req, res) => {
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
// ************ GET EVENTS *********************//
CustomerMediaController._getLiveEventsWithPhotoUrl = async (filterQuery) => {
    const liveEvents = await LiveRepo_1.LiveRepo.getSelectedLive(filterQuery);
    const settledResults = await Promise.allSettled(liveEvents.map(async (event) => {
        const signedUrl = await media_access_1.MediaAccess.getSignedUrl(event.cover_photo.Bucket, event.cover_photo.Key, 'photo');
        const result = {
            liveEvent: event,
            photo_url: signedUrl,
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
CustomerMediaController.getLiveEvents = Catch_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
    });
    (0, responder_1.sendResponse)({
        res,
        data: _a._mergeEventAndPhotoUrl(liveEvents),
        message: 'live events fetched',
    });
});
CustomerMediaController.getLiveEventsFeatured = Catch_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        featured: true,
    });
    (0, responder_1.sendResponse)({
        res,
        data: liveEvents,
        message: 'live featured events fetched',
    });
});
CustomerMediaController.getLiveEventsSponsored = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.getLiveEventsChannels = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.getLiveEventsChannelsPop = Catch_1.Catch.async(async (_, res) => {
    const liveEvents = await _a._getLiveEventsWithPhotoUrl({
        expired: false,
        type: 'channel',
        popular: true,
    });
    (0, responder_1.sendResponse)({
        res,
        data: liveEvents,
        message: 'live events fetched: popular',
    });
});
CustomerMediaController.getLiveEventsEven = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.getLiveEventsEvenPop = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.getLiveEventsTvshow = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.getLiveEventsTvshowPop = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.getLiveEventsSports = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.getLiveEventsSportsPop = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.getLiveEventsPodcast = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.getLiveEventsPodcastPop = Catch_1.Catch.async(async (_, res) => {
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
CustomerMediaController.streamLiveEvent = Catch_1.Catch.async(async (req, res) => {
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
