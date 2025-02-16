"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUploadService = void 0;
const poster_model_1 = require("../../models/poster.model");
const videos_model_1 = require("../../models/videos.model");
const OperationalError_1 = require("../../utils/OperationalError");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
const seasons_model_1 = require("../../models/seasons.model");
const episodes_model_1 = require("../../models/episodes.model");
const media_management_1 = require("../media-management");
const trailer_model_1 = require("../../models/trailer.model");
const videoupload_model_1 = require("../../models/videoupload.model");
const VideoRepo_1 = require("../../repositories/VideoRepo");
const MovieMediaSourcesUtils_1 = require("../../utils/MovieMediaSourcesUtils");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
class AdminUploadService {
}
exports.AdminUploadService = AdminUploadService;
_a = AdminUploadService;
AdminUploadService._allowMimetype = (file, type, msg) => {
    if (!file.mimetype.startsWith(type)) {
        throw new OperationalError_1.OperationalError(msg, 400);
    }
};
AdminUploadService.resolveWithMediaSources = (queryParams) => queryParams.withMediaSources === 'true';
AdminUploadService._uploadTrailerAndVideo = async (video, trailer, session) => {
    const files = [video, trailer];
    const [videoUpload, trailerUpload] = await Promise.all(files.map(file => media_management_1.MediaManagement.uploadAndTransacodeVideo({
        file: file.file,
        expire: file.expire,
    })));
    const videoUploadDoc = new videoupload_model_1.VideoUploadModel({
        bucket: videoUpload.Bucket,
        key: videoUpload.Key,
        mimetype: videoUpload.mimetype,
        size: videoUpload.size,
        isTranscoded: videoUpload.isTranscoded,
        parentId: video.parentId,
        parentType: video.parentType,
    });
    const trailerVidUploadDoc = new videoupload_model_1.VideoUploadModel({
        bucket: trailerUpload.Bucket,
        key: trailerUpload.Key,
        mimetype: trailerUpload.mimetype,
        size: trailerUpload.size,
        isTranscoded: trailerUpload.isTranscoded,
        parentId: trailer.parentId,
        parentType: trailer.parentType,
    });
    await videoUploadDoc.save({ session });
    await trailerVidUploadDoc.save({ session });
    return { videoUploadDoc, trailerVidUploadDoc };
};
AdminUploadService._getVideoUploadDoc = async (params, session) => {
    const res = await media_management_1.MediaManagement.uploadAndTransacodeVideo({
        file: params.file,
        expire: params.expire,
    });
    const videoUploadDoc = new videoupload_model_1.VideoUploadModel({
        bucket: res.Bucket,
        key: res.Key,
        mimetype: res.mimetype,
        size: res.size,
        isTranscoded: res.isTranscoded,
        parentId: params.parentId,
        parentType: params.parentType,
    });
    await videoUploadDoc.save({ session });
    return videoUploadDoc;
};
AdminUploadService._uploadVideoPosters = async (portraitFile, landscapeFile) => {
    const [portraitUpload, landscapeUpload] = await Promise.all([
        media_management_1.MediaManagement.store({ baseDir: 'images', expire: undefined, file: portraitFile }),
        media_management_1.MediaManagement.store({ baseDir: 'images', expire: undefined, file: landscapeFile }),
    ]);
    return {
        portraitUpload,
        landscapeUpload,
    };
};
AdminUploadService._savePostersUploadToDb = async ({ portraitPosterUpload, landscapePosterUpload, videoId, posterParentType, }, session) => {
    // save portrait
    const portrait = await new poster_model_1.PosterImageModel({
        video_id: videoId,
        bucket: portraitPosterUpload.Bucket,
        key: portraitPosterUpload.Key,
        parentType: posterParentType,
        dimension: 'portrait',
    }).save({ session });
    // save landscape
    const landscape = await new poster_model_1.PosterImageModel({
        video_id: videoId,
        bucket: landscapePosterUpload.Bucket,
        key: landscapePosterUpload.Key,
        parentType: posterParentType,
        dimension: 'landscape',
    }).save({ session });
    return { portrait, landscape };
};
AdminUploadService._uploadAndSavePostersToDB = async ({ landscapeFile, portraitFile, videoId, posterParentType }, session) => {
    const { portraitUpload, landscapeUpload } = await _a._uploadVideoPosters(portraitFile, landscapeFile);
    //save to db
    return await _a._savePostersUploadToDb({
        portraitPosterUpload: portraitUpload,
        landscapePosterUpload: landscapeUpload,
        videoId,
        posterParentType,
    }, session);
};
AdminUploadService._uploadVideoSession = async ({ data, type, adminId }, session) => {
    _a._allowMimetype(data.portraitPoster, 'image', 'portraitPoster must be an image');
    _a._allowMimetype(data.landscapePoster, 'image', 'landscapePoster must be an image');
    data.trailer && _a._allowMimetype(data.trailer, 'video', ' trailer must be a video file');
    data.video && _a._allowMimetype(data.video, 'video', 'video must be a video file');
    const isSeries = type === 'series';
    const videoDoc = new videos_model_1.VideoModel({
        type,
        admin_id: adminId,
        title: data.title,
        description: data.description,
        vid_class: data.vidClass,
        artist_name: data.artistName,
        pg: data.pg,
        genre: data.genre ?? [],
        category: data.category ?? [],
        cast: data.cast ?? [],
        default_rating: data.defaultRating,
        released_date: data.releasedDate,
        expiry_date: data.expiryDate,
        videoLink: data.videoLink,
        trailerLink: data.trailerLink,
        runtime: data.runtime,
        is_series: isSeries,
    });
    const { landscape, portrait } = await _a._uploadAndSavePostersToDB({
        portraitFile: data.portraitPoster,
        landscapeFile: data.landscapePoster,
        videoId: videoDoc._id,
        posterParentType: 'vod',
    }, session);
    videoDoc.landscape_photo = landscape._id;
    videoDoc.portrait_photo = portrait._id;
    const vidUploadExpire = videoDoc.expiry_date || undefined;
    if (data.trailer && data.video) {
        const expire = vidUploadExpire;
        const trailerDoc = new trailer_model_1.TrailerModel({
            video_id: videoDoc._id,
            parentType: 'vod',
        });
        const { videoUploadDoc, trailerVidUploadDoc } = await _a._uploadTrailerAndVideo({ file: data.video, expire, parentId: videoDoc._id, parentType: 'vod' }, { file: data.trailer, expire, parentId: trailerDoc._id, parentType: 'trailer' }, session);
        trailerDoc.video_upload = trailerVidUploadDoc._id;
        videoDoc.video_upload = videoUploadDoc._id;
        videoDoc.trailer_upload = trailerDoc._id;
        await trailerDoc.save({ session });
        await videoDoc.save({ session });
        return videoDoc;
    }
    if (data.trailer) {
        const trailerDoc = new trailer_model_1.TrailerModel({
            video_id: videoDoc._id,
            parentType: 'vod',
        });
        const tVidUploadDoc = await _a._getVideoUploadDoc({
            file: data.trailer,
            expire: vidUploadExpire,
            parentId: trailerDoc._id,
            parentType: 'trailer',
        }, session);
        trailerDoc.video_upload = tVidUploadDoc._id;
        videoDoc.trailer_upload = trailerDoc._id;
        await trailerDoc.save({ session });
    }
    if (data.video) {
        const vidUploadDoc = await _a._getVideoUploadDoc({
            file: data.video,
            expire: vidUploadExpire,
            parentId: videoDoc._id,
            parentType: 'vod',
        }, session);
        videoDoc.video_upload = vidUploadDoc._id;
    }
    await videoDoc.save({ session });
    return videoDoc;
};
AdminUploadService._validateWithMovieAndPrevSeasonsAggrResult = (res) => {
    if (res.length === 0) {
        throw new OperationalError_1.OperationalError('invalid videoId', 404);
    }
    console.dir({ res: JSON.parse(JSON.stringify(res)) }, { depth: null });
    const { totalEpisodesOfLastSeason, movieExpiryDate, totalPreviousSeasons, movieTrailerLink, isMovieTrailerVidUploadTranscoded, isMovieSeries, } = res[0];
    if (!isMovieSeries) {
        throw new OperationalError_1.OperationalError('movie is not a series', 403);
    }
    if (totalPreviousSeasons > 0 && totalEpisodesOfLastSeason === 0) {
        throw new OperationalError_1.OperationalError('Creating a new season when the most recent season has no episodes is not allowed', 403);
    }
    // Movie must not have a trailer but if it does and it is a trailer upload then season creation must wait for transcode to complete
    if (movieTrailerLink == null && isMovieTrailerVidUploadTranscoded === false) {
        throw new OperationalError_1.OperationalError('Movie trailer video upload has not finished transcoding', 403);
    }
    if (movieExpiryDate && new Date() > movieExpiryDate) {
        throw new OperationalError_1.OperationalError('Movie has expired', 403);
    }
};
AdminUploadService._addSeasonWithSession = async ({ videoId, adminId, ...params }, session) => {
    params.trailer && _a._allowMimetype(params.trailer, 'video', ' trailer must be a video file');
    params.landscapePhoto &&
        _a._allowMimetype(params.landscapePhoto, 'image', ' landscapePhoto must be an image file');
    params.portraitPhoto &&
        _a._allowMimetype(params.portraitPhoto, 'image', ' portraitPhoto must be an image file');
    const aggrRes = await VideoRepo_1.VideoRepo.addSeasonUtilAggr(videoId);
    _a._validateWithMovieAndPrevSeasonsAggrResult(aggrRes);
    const season = new seasons_model_1.SeasonModel({
        admin: adminId,
        video: videoId,
        serial_number: aggrRes[0].totalPreviousSeasons + 1,
        trailerLink: params.trailerLink,
    });
    if (params.landscapePhoto && params.portraitPhoto) {
        const { landscape, portrait } = await _a._uploadAndSavePostersToDB({
            portraitFile: params.portraitPhoto,
            landscapeFile: params.landscapePhoto,
            videoId: season._id,
            posterParentType: 'season',
        }, session);
        season.landscapePhoto = landscape._id;
        season.portraitPhoto = portrait.id;
    }
    if (params.trailer) {
        const trailerDoc = new trailer_model_1.TrailerModel({
            video_id: season._id,
            parentType: 'season',
        });
        const tVidUploadDoc = await _a._getVideoUploadDoc({
            file: params.trailer,
            expire: aggrRes[0].movieExpiryDate,
            parentId: trailerDoc._id,
            parentType: 'trailer',
        }, session);
        trailerDoc.video_upload = tVidUploadDoc._id;
        season.trailer = trailerDoc._id;
        await trailerDoc.save({ session });
    }
    await season.save({ session });
    return season;
};
AdminUploadService._validateWithSeasonAndPrevEpisodes = (aggrRes) => {
    if (aggrRes.length == 0) {
        throw new OperationalError_1.OperationalError('invalid season Id', 404);
    }
    const [{ totalPreviousEpisodes, isRecentEpisodeTrailerVidUploadTranscoded, isRecentEpisodeVidUploadTranscoded, isTrailerUploadVidTranscoded, seasonTrailerLink, recentEpisodeTrailerLink, recentEpisodeVideoLink, },] = aggrRes;
    if (totalPreviousEpisodes === 0)
        return;
    if (seasonTrailerLink === null && isTrailerUploadVidTranscoded === false) {
        throw new OperationalError_1.OperationalError('season trailer upload video is still transcoding', 400);
    }
    if (recentEpisodeTrailerLink === null && isRecentEpisodeTrailerVidUploadTranscoded === false) {
        throw new OperationalError_1.OperationalError("previousEpisode's trailer video upload is still transcoding", 400);
    }
    if (recentEpisodeVideoLink === null && isRecentEpisodeVidUploadTranscoded === false) {
        throw new OperationalError_1.OperationalError("previousEpisode's video is still transcoding", 400);
    }
};
AdminUploadService._addEpisodesWithSession = async ({ seasonId, data, adminId }, session) => {
    data.subTitle && _a._allowMimetype(data.subTitle, 'text', 'subTitle must be a text file');
    data.trailer && _a._allowMimetype(data.trailer, 'video', ' trailer must be a video file');
    data.video && _a._allowMimetype(data.video, 'video', 'video must be a video file');
    const aggrUtilsRes = await VideoRepo_1.VideoRepo.addEpisodeUtilAggr(seasonId);
    _a._validateWithSeasonAndPrevEpisodes(aggrUtilsRes);
    const episode = new episodes_model_1.EpisodeModel({
        title: data.title,
        description: data.description,
        episodeNumber: aggrUtilsRes[0].totalPreviousEpisodes + 1,
        trailerLink: data.trailerLink,
        videoLink: data.videoLink,
        season: seasonId,
        admin: adminId,
    });
    if (data.trailer && data.video) {
        const expire = undefined;
        const trailerDoc = new trailer_model_1.TrailerModel({
            video_id: episode._id,
            parentType: 'episode',
        });
        const { videoUploadDoc, trailerVidUploadDoc } = await _a._uploadTrailerAndVideo({ file: data.video, expire, parentId: episode._id, parentType: 'episode' }, { file: data.trailer, expire, parentId: trailerDoc._id, parentType: 'trailer' }, session);
        trailerDoc.video_upload = trailerVidUploadDoc._id;
        episode.videoUpload = videoUploadDoc._id;
        episode.trailerUpload = trailerDoc._id;
        await trailerDoc.save({ session });
        await episode.save({ session });
        return episode;
    }
    if (data.trailer) {
        const trailerDoc = new trailer_model_1.TrailerModel({
            video_id: episode._id,
            parentType: 'episode',
        });
        const tVidUploadDoc = await _a._getVideoUploadDoc({
            file: data.trailer,
            expire: undefined,
            parentId: trailerDoc._id,
            parentType: 'trailer',
        }, session);
        trailerDoc.video_upload = tVidUploadDoc._id;
        episode.trailerUpload = trailerDoc._id;
        await trailerDoc.save({ session });
    }
    if (data.video) {
        const vidUploadDoc = await _a._getVideoUploadDoc({
            file: data.video,
            expire: undefined,
            parentId: episode._id,
            parentType: 'episode',
        }, session);
        episode.videoUpload = vidUploadDoc._id;
    }
    await episode.save({ session });
    return episode;
};
AdminUploadService.addVideo = async (input) => {
    return await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._uploadVideoSession, input);
};
AdminUploadService.addSeason = async (params) => {
    return await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._addSeasonWithSession, params);
};
AdminUploadService.addEpisode = async (input) => {
    return await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._addEpisodesWithSession, input);
};
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
};
AdminUploadService.getVideos = async (type, queryParams) => {
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(queryParams.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(queryParams.limit, 1);
    const vidsWithSources = await MovieMediaSourcesUtils_1.MovieMediaSourcesUtils.resolveMediaSources(await VideoRepo_1.VideoRepo.fetchByType(type, page, limit), _a.resolveWithMediaSources(queryParams), '720p');
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
