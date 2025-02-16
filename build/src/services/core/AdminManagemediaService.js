"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminManageMediaService = void 0;
const lives_model_1 = require("../../models/lives.model");
const subtitle_model_1 = require("../../models/subtitle.model");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const videos_model_1 = require("../../models/videos.model");
const UserRepo_1 = require("../../repositories/UserRepo");
const live_1 = require("../../utils/live");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
const LiveRepo_1 = require("../../repositories/LiveRepo");
const LiveMediaSourcesUtils_1 = require("../../utils/LiveMediaSourcesUtils");
const episodes_model_1 = require("../../models/episodes.model");
const media_management_1 = require("../media-management");
class AdminManageMediaService {
}
exports.AdminManageMediaService = AdminManageMediaService;
_a = AdminManageMediaService;
AdminManageMediaService.searchClient = async (searchText, query) => {
    const searchReg = new RegExp(searchText, 'i');
    const features = new QueryParamsFeatures_1.QueryParamsFeatures(UserRepo_1.UserRepo.searchUsersByRegexQuery(searchReg), {
        defaultLimit: 200,
        defaultPage: 1,
        queryParams: query,
    });
    return await features.paginate().query;
};
AdminManageMediaService.getLivesByType = async (type, query) => {
    const lives = await LiveRepo_1.LiveRepo.fetchLivesByType(type, (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1), (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10));
    return await LiveMediaSourcesUtils_1.LiveMediaSourcesUtils.resolveSources(lives, '720p');
};
AdminManageMediaService._findSubtitlesParent = async (data) => {
    switch (data.parentType) {
        case 'episode':
            return await episodes_model_1.EpisodeModel.findById(data.parentId);
        case 'vod':
            return await videos_model_1.VideoModel.findById(data.parentId);
        default:
            throw new OperationalError_1.OperationalError(`${data.parentType} is not a valid subtitle parent type`, 400);
    }
};
AdminManageMediaService.addSubtitle = async (data) => {
    if ((await _a._findSubtitlesParent(data)) == null) {
        throw new OperationalError_1.OperationalError('parent does not exist', 404);
    }
    const { Bucket, Key } = await media_management_1.MediaManagement.store({
        file: data.subtitle,
        expire: undefined,
        baseDir: 'subtitles',
    });
    const subtitle = await subtitle_model_1.SubtitleModel.create({
        video_id: data.parentId,
        parentType: data.parentType,
        bucket: Bucket,
        key: Key,
        language: data.language,
    });
    return subtitle;
};
AdminManageMediaService._createLiveWithSession = async (data, session) => {
    const { client_id, title, sub_title, cover_photo, vid_class, pg, category, description, type, start, expiry, 
    // sponsored,
    // popular,
    video, location, } = data;
    const vclient_id = await UserRepo_1.UserRepo.getClientByRolesAndId(data.clientId, [
        'channel',
        'event',
        'podcast',
        'tvshow',
    ]);
    if (!vclient_id) {
        throw new OperationalError_1.OperationalError('Client not found', 404);
    }
    const [streamOngoing, scheduledStream] = await Promise.all([
        lives_model_1.LiveModel.findOne({ client_id, active: true }),
        lives_model_1.LiveModel.findOne({ client_id, active: false, expired: false }),
    ]);
    if (streamOngoing) {
        throw new OperationalError_1.OperationalError('client has an ongoing stream', 400);
    }
    if (scheduledStream) {
        throw new OperationalError_1.OperationalError('client has a scheduled stream', 400);
    }
    await new lives_model_1.LiveModel({
        client_id: vclient_id._id,
        title: title,
        sub_title: sub_title,
        stream_key: await (0, live_1.getUniqueStreamKey)(),
        cover_photo: cover_photo,
        vid_class: vid_class,
        pg: pg,
        category: category,
        description: description,
        type: type,
        start: new Date(start),
        expiry: new Date(expiry),
        // sponsored,
        // popular,
        location,
        preview_video: video,
    }).save({ session });
    //   if (live.preview_video) {
    //     await VideoUploadRepo.updateWithParent({
    //       session,
    //       id: live.preview_video.toString(),
    //       parentId: live._id.toString(),
    //       parentType: 'live',
    //     })
    //   }
};
AdminManageMediaService.createLive = async (data) => {
    return await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._createLiveWithSession, data);
};
