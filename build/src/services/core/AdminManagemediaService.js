"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminManageMediaService = void 0;
const subtitle_model_1 = require("../../models/subtitle.model");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const videos_model_1 = require("../../models/videos.model");
const UserRepo_1 = require("../../repositories/UserRepo");
const LiveRepo_1 = require("../../repositories/LiveRepo");
const LiveMediaSourcesUtils_1 = require("../../utils/LiveMediaSourcesUtils");
const episodes_model_1 = require("../../models/episodes.model");
const media_management_1 = require("../media-management");
const promises_1 = require("../../utils/promises");
const photoUtils_1 = require("../../utils/photoUtils");
class AdminManageMediaService {
}
exports.AdminManageMediaService = AdminManageMediaService;
_a = AdminManageMediaService;
AdminManageMediaService.searchClient = async (searchText, query) => {
    const response = await UserRepo_1.UserRepo.adminFetchClientsBySearchAggr(new RegExp(searchText, 'i'), (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1), (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10));
    return (0, promises_1.getPromiseAllFulfilledResults)(await Promise.allSettled(response.map(photoUtils_1.PhotoUtils.fetchUserAggrResPhoto)));
};
AdminManageMediaService.getLivesByType = async (type, query) => {
    const types = ['channel', 'event', 'podcast', 'sport', 'tvshow'];
    if (!types.includes(type)) {
        throw new OperationalError_1.OperationalError('invalid live type', 400);
    }
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
