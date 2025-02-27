"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUploadService = void 0;
const videos_model_1 = require("../../models/videos.model");
const OperationalError_1 = require("../../utils/OperationalError");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
const VideoRepo_1 = require("../../repositories/VideoRepo");
const MovieMediaSourcesUtils_1 = require("../../utils/MovieMediaSourcesUtils");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const UploadMediaUtils_1 = require("../../utils/UploadMediaUtils");
const Purge_1 = require("../../utils/Purge");
class AdminUploadService extends UploadMediaUtils_1.UploadMediaUtils {
}
exports.AdminUploadService = AdminUploadService;
_a = AdminUploadService;
AdminUploadService.resolveWithMediaSources = (queryParams) => queryParams.withMediaSources === 'true';
AdminUploadService.addVideo = async (input) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._uploadVideoSession, input);
AdminUploadService.addSeason = async (params) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._addSeasonWithSession, params);
AdminUploadService.addEpisode = async (input) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._addEpisodesWithSession, input);
AdminUploadService.editVideo = async ({ vidId, type, changes }) => {
    const video = await videos_model_1.VideoModel.findOne({ _id: vidId, type });
    if (video == null) {
        throw new OperationalError_1.OperationalError('video does not exist or does not exist as this type', 400);
    }
    delete changes['_id'];
    const updatedVid = await videos_model_1.VideoModel.findOneAndUpdate({
        _id: vidId,
        type,
    }, changes, {
        new: true,
    });
    if (updatedVid == null) {
        throw new OperationalError_1.OperationalError('Could not update video or video does not exist', 404);
    }
    return updatedVid;
};
AdminUploadService.deleteVideo = async (vidId, type) => {
    const deletedVid = await videos_model_1.VideoModel.findOneAndDelete({ _id: vidId, type });
    if (deletedVid == null) {
        throw new OperationalError_1.OperationalError(`Not found or video is not a ${type} `, 404);
    }
    // do not await
    Purge_1.Purge.vod(deletedVid);
};
AdminUploadService.getVideos = async (type, queryParams) => {
    const vids = await VideoRepo_1.VideoRepo.fetchByType(type, (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(queryParams.page, 1), (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(queryParams.limit, 1));
    const vidsWithSources = await MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(vids, _a.resolveWithMediaSources(queryParams), '720p');
    return vidsWithSources;
};
AdminUploadService.getSeasonsAndEpisodes = async (vidSeriesId, queryParams) => {
    const vid = await videos_model_1.VideoModel.findById(vidSeriesId);
    if (vid == null) {
        throw new OperationalError_1.OperationalError('invalid video Id', 404);
    }
    if (!vid.is_series) {
        throw new OperationalError_1.OperationalError('video is not a series', 400);
    }
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(queryParams.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(queryParams.limit, 10);
    const seasons = (await VideoRepo_1.VideoRepo.fetchSeasonsAndEpisodes(vidSeriesId, page, limit));
    const seasonsWithMediaSources = await MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveSeasonsMediaSources(seasons, _a.resolveWithMediaSources(queryParams), '720p', MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveEpisodesMediaSources);
    return seasonsWithMediaSources;
};
