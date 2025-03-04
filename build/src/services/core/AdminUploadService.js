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
const seasons_model_1 = require("../../models/seasons.model");
// type EditVideoInput = {
//   vidId: string
//   type: AllVideoTypes
//   changes: Record<string, any>
// }
class AdminUploadService extends UploadMediaUtils_1.UploadMediaUtils {
}
exports.AdminUploadService = AdminUploadService;
_a = AdminUploadService;
AdminUploadService.resolveWithMediaSources = (queryParams) => queryParams.withMediaSources === 'true';
AdminUploadService.addVideo = async (input) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._uploadVideoSession, input);
AdminUploadService.addSeason = async ({ videoId, adminId, description }) => {
    const aggrRes = await VideoRepo_1.VideoRepo.addSeasonUtilAggr(videoId);
    _a._validateWithMovieAndPrevSeasonsAggrResult(aggrRes);
    return await seasons_model_1.SeasonModel.create({
        description,
        admin: adminId,
        video: videoId,
        serial_number: aggrRes[0].totalPreviousSeasons + 1,
    });
};
AdminUploadService.canAddSeason = async (videoId) => {
    const aggrRes = await VideoRepo_1.VideoRepo.addSeasonUtilAggr(videoId);
    _a._validateWithMovieAndPrevSeasonsAggrResult(aggrRes);
};
AdminUploadService.canAddEpisode = async (seasonId) => {
    const aggrUtilsRes = await VideoRepo_1.VideoRepo.addEpisodeUtilAggr(seasonId);
    _a._validateWithSeasonAndPrevEpisodes(aggrUtilsRes);
};
AdminUploadService.addEpisode = async (input) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._addEpisodesWithSession, input);
AdminUploadService.editVideo = async (input) => await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._editVideoSession, input);
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
