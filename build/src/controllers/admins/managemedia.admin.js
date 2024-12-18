"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminManagemediaController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const lives_model_1 = require("../../models/lives.model");
const subtitle_model_1 = require("../../models/subtitle.model");
const users_model_1 = require("../../models/users.model");
const media_access_1 = require("../../services/media-access");
const strGen_1 = require("../../utils/strGen");
const responder_1 = require("../../utils/responder");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const videos_model_1 = require("../../models/videos.model");
const media_management_1 = require("../../services/media-management");
class AdminManagemediaController {
}
exports.AdminManagemediaController = AdminManagemediaController;
_a = AdminManagemediaController;
AdminManagemediaController.uploadLargeVideoRoute = catchAsync_1.Catch.async(async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { fileName, fileHandle, expire } = req.body;
    const video = await (0, media_management_1.uploadLargeVideos)(req, fileHandle, fileName, expire, res);
    (0, responder_1.sendResponse)({ res, data: video, message: 'large video uploaded' });
});
AdminManagemediaController.uploadShortVideoRoute = catchAsync_1.Catch.async(async (req, res) => {
    // const user = GetDefined.loggedInUser(req.user)
    const { fileName, fileHandle, expire } = req.body;
    const video = await (0, media_management_1.uploadShortVideos)(req, fileHandle, expire, fileName);
    (0, responder_1.sendResponse)({ res, data: video, message: 'short video uploaded' });
});
AdminManagemediaController.uploadVidSubtitle = catchAsync_1.Catch.async(async (req, res) => {
    const { fileName, fileHandle } = req.body;
    console.log(req.body);
    const video = await (0, media_management_1.uploadSubtitle)(req, fileHandle, fileName);
    (0, responder_1.sendResponse)({ res, data: video, message: 'video subtitle uploaded' });
});
AdminManagemediaController.uploadImageRoute = catchAsync_1.Catch.async(async (req, res) => {
    const { fileName, fileHandle } = req.body;
    const image = await (0, media_management_1.uploadImage)(req, fileHandle, fileName);
    (0, responder_1.sendResponse)({ res, data: image, message: 'image uploaded' });
});
AdminManagemediaController.adminGetPhotoUrl = catchAsync_1.Catch.async(async (req, res) => {
    // const user = GetDefined.loggedInUser(req.user)
    const { bucket, key } = req.body;
    const image = await (0, media_access_1.readPhotos)(bucket, key);
    (0, responder_1.sendResponse)({ res, data: image, message: 'image fetched' });
});
AdminManagemediaController.createLive = catchAsync_1.Catch.async(async (req, res) => {
    const { client_id, title, sub_title, cover_photo, vid_class, pg, category, description, type, start, expiry, sponsored, popular, video, location, } = req.body;
    if (!client_id ||
        !title ||
        !sub_title ||
        !cover_photo ||
        !vid_class ||
        !pg ||
        !category ||
        !description ||
        !type ||
        !sponsored ||
        !popular ||
        !start ||
        !location) {
        throw new OperationalError_1.OperationalError('all important fields are required', 400);
    }
    const vclient_id = await users_model_1.UserModel.findOne({
        _id: client_id,
        role: { $in: ['channel', 'event', 'podcast', 'tvshow'] },
    });
    if (!vclient_id) {
        throw new OperationalError_1.OperationalError('assigned user not found', 404);
    }
    const streamId = (0, strGen_1.genRandUniqId)(12);
    const streamIdExist = await lives_model_1.LiveModel.findOne({
        stream_key: streamId,
    });
    if (streamIdExist) {
        throw new OperationalError_1.OperationalError('Oops, please try again', 400);
    }
    const streamOngoing = await lives_model_1.LiveModel.find({ client_id, active: true });
    if (streamOngoing.length > 0) {
        throw new OperationalError_1.OperationalError('client have an ongoing stream', 400);
    }
    const scheduledStream = await lives_model_1.LiveModel.findOne({
        client_id,
        active: true,
        expired: false,
    });
    if (scheduledStream) {
        throw new OperationalError_1.OperationalError('client alrealdy have pending scheduled stream', 400);
    }
    await new lives_model_1.LiveModel({
        client_id: vclient_id._id,
        title: title,
        sub_title: sub_title,
        stream_key: streamId,
        cover_photo: cover_photo,
        vid_class: vid_class,
        pg: pg,
        category: category,
        description: description,
        type: type,
        start: new Date(start),
        expiry: new Date(expiry),
        sponsored,
        popular,
        location,
        preview_video: video,
    }).save();
    (0, responder_1.sendResponse)({
        res,
        message: 'live stream event scheduled, credentials are on attached user dashboard',
    });
});
AdminManagemediaController.searchClient = catchAsync_1.Catch.async(async (req, res) => {
    const search = req.query.search;
    const searchReg = new RegExp(search, 'i');
    const clients = await users_model_1.UserModel.find({
        role: { $in: ['channel', 'tvshow', 'event', 'podcast'] },
        $or: [
            { first_name: { $regex: searchReg } },
            { last_name: { $regex: searchReg } },
            { email: { $regex: searchReg } },
        ],
    }).select('_id first_name last_name role');
    (0, responder_1.sendResponse)({
        res,
        data: clients,
        message: 'matched clients fetched',
    });
});
AdminManagemediaController.livesChannels = catchAsync_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const allDat = await lives_model_1.LiveModel.find({
        type: 'channel',
    })
        .select('_id title pg vid_class active expiry cover_photo views')
        .skip((page - 1) * limit)
        .limit(limit);
    (0, responder_1.sendResponse)({
        res,
        data: allDat,
        message: 'live channels fecthed',
    });
});
AdminManagemediaController.livesEvents = catchAsync_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const allDat = await lives_model_1.LiveModel.find({
        type: 'event',
    })
        .select('_id title pg vid_class active expiry cover_photo views')
        .skip((page - 1) * limit)
        .limit(limit);
    (0, responder_1.sendResponse)({
        res,
        data: allDat,
        message: 'live events fecthed',
    });
});
AdminManagemediaController.livesTvshows = catchAsync_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const allDat = await lives_model_1.LiveModel.find({
        type: 'tvshow',
    })
        .select('_id title pg vid_class active expiry cover_photo views')
        .skip((page - 1) * limit)
        .limit(limit);
    (0, responder_1.sendResponse)({
        res,
        data: allDat,
        message: 'live tvShows fecthed',
    });
});
//TODO delete and edit channel
AdminManagemediaController.addSubtitle = catchAsync_1.Catch.async(async (req, res) => {
    const { vid_id, bucket, key, language, is_series } = req.body;
    const vid = await videos_model_1.VideoModel.findById(vid_id);
    if (!vid) {
        throw new OperationalError_1.OperationalError('specified video id not found', 400);
    }
    await new subtitle_model_1.SubtitleModel({
        video_id: vid_id,
        bucket,
        key,
        language,
        is_series,
    }).save();
    (0, responder_1.sendResponse)({
        res,
        message: 'subtitle added successfully',
    });
});
