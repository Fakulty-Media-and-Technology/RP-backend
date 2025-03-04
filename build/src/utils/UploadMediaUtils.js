"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadMediaUtils = void 0;
const poster_model_1 = require("../models/poster.model");
const videos_model_1 = require("../models/videos.model");
const OperationalError_1 = require("../utils/OperationalError");
const episodes_model_1 = require("../models/episodes.model");
const media_management_1 = require("./../services/media-management");
const trailer_model_1 = require("../models/trailer.model");
const videoupload_model_1 = require("../models/videoupload.model");
const VideoRepo_1 = require("../repositories/VideoRepo");
const admin_1 = require("../validations/admin");
const requestValidator_1 = require("../middlewares/requestValidator");
const Purge_1 = require("./Purge");
class UploadMediaUtils {
}
exports.UploadMediaUtils = UploadMediaUtils;
_a = UploadMediaUtils;
UploadMediaUtils._validateAddMovieData = (type, data, files) => {
    if (type === 'series') {
        (0, requestValidator_1.validate)(admin_1.addSeriesSchema, data);
        return;
    }
    Object.assign(data, {
        ...data,
        video: files.video?.[0],
    });
    switch (type) {
        case 'movie':
            (0, requestValidator_1.validate)(admin_1.addMovieOrSkitSchema, data);
            break;
        case 'skit':
            (0, requestValidator_1.validate)(admin_1.addMovieOrSkitSchema, data);
            break;
        case 'music-video':
            (0, requestValidator_1.validate)(admin_1.addMusicVideoSchema, data);
            break;
        default:
            throw new OperationalError_1.OperationalError(`Valid movie types are ${videos_model_1.videoTypes.join(' || ')} `, 400);
    }
};
UploadMediaUtils._checkFiles = (files) => {
    if (files == null) {
        throw new OperationalError_1.OperationalError('expected at least one file', 400);
    }
    if (Array.isArray(files)) {
        throw new OperationalError_1.OperationalError('expected multiple files as an object', 400);
    }
    return files;
};
UploadMediaUtils._allowMimetype = (file, type, msg) => {
    if (!file.mimetype.startsWith(type)) {
        throw new OperationalError_1.OperationalError(msg, 400);
    }
};
UploadMediaUtils._uploadTrailerAndVideo = async (video, trailer, session) => {
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
UploadMediaUtils._getVideoUploadDoc = async (params, session) => {
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
UploadMediaUtils._uploadVideoPosters = async (portraitFile, landscapeFile) => {
    const [portraitUpload, landscapeUpload] = await Promise.all([
        media_management_1.MediaManagement.store({ baseDir: 'images', expire: undefined, file: portraitFile }),
        media_management_1.MediaManagement.store({ baseDir: 'images', expire: undefined, file: landscapeFile }),
    ]);
    return {
        portraitUpload,
        landscapeUpload,
    };
};
UploadMediaUtils._savePostersUploadToDb = async ({ portraitPosterUpload, landscapePosterUpload, videoId, posterParentType, }, session) => {
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
UploadMediaUtils._uploadAndSavePostersToDB = async ({ landscapeFile, portraitFile, videoId, posterParentType }, session) => {
    const { portraitUpload, landscapeUpload } = await _a._uploadVideoPosters(portraitFile, landscapeFile);
    //save to db
    return await _a._savePostersUploadToDb({
        portraitPosterUpload: portraitUpload,
        landscapePosterUpload: landscapeUpload,
        videoId,
        posterParentType,
    }, session);
};
UploadMediaUtils._validateAddVideoFileTypes = (data) => {
    data.portraitPoster &&
        _a._allowMimetype(data.portraitPoster, 'image', 'portraitPoster must be an image');
    data.landscapePoster &&
        _a._allowMimetype(data.landscapePoster, 'image', 'landscapePoster must be an image');
    data.trailer && _a._allowMimetype(data.trailer, 'video', ' trailer must be a video file');
    data.video && _a._allowMimetype(data.video, 'video', 'video must be a video file');
};
UploadMediaUtils._uploadVidAndTrailer = async ({ data, videoDoc }, session) => {
    const expire = videoDoc.expiry_date ?? undefined;
    if (data.trailer && data.video) {
        const trailerDoc = new trailer_model_1.TrailerModel({
            video_id: videoDoc._id,
            parentType: 'vod',
        });
        const { videoUploadDoc, trailerVidUploadDoc } = await _a._uploadTrailerAndVideo({ file: data.video, expire, parentId: videoDoc._id, parentType: 'vod' }, { file: data.trailer, expire, parentId: trailerDoc._id, parentType: 'trailer' }, session);
        trailerDoc.video_upload = trailerVidUploadDoc._id;
        videoDoc.video_upload = videoUploadDoc._id;
        videoDoc.trailer_upload = trailerDoc._id;
        await trailerDoc.save({ session });
        return;
    }
    if (data.trailer) {
        const trailerDoc = new trailer_model_1.TrailerModel({
            video_id: videoDoc._id,
            parentType: 'vod',
        });
        const tVidUploadDoc = await _a._getVideoUploadDoc({
            file: data.trailer,
            expire,
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
            parentId: videoDoc._id,
            parentType: 'vod',
            expire,
        }, session);
        videoDoc.video_upload = vidUploadDoc._id;
    }
};
UploadMediaUtils._uploadVideoSession = async (params, session) => {
    const { data, type, adminId } = params;
    _a._validateAddVideoFileTypes(data);
    if (data.vidClass === 'exclusive' && data.amount == null) {
        throw new OperationalError_1.OperationalError('amount is required when vid class is exclusive', 400);
    }
    const videoDoc = new videos_model_1.VideoModel({
        type,
        admin_id: adminId,
        title: data.title,
        description: data.description,
        vid_class: data.vidClass,
        artist_name: data.artistName,
        pg: data.pg,
        amount: data.amount,
        genre: data.genre ?? [],
        category: data.category ?? [],
        cast: data.cast ?? [],
        default_rating: data.defaultRating,
        released_date: data.releasedDate,
        expiry_date: data.expiryDate,
        videoLink: data.videoLink,
        trailerLink: data.trailerLink,
        runtime: data.runtime,
        active: data.active,
        showViews: data.showViews,
        is_series: type === 'series',
    });
    const uploadPostersParams = {
        portraitFile: data.portraitPoster,
        landscapeFile: data.landscapePoster,
        videoId: videoDoc._id,
        posterParentType: 'vod',
    };
    const uploadVidAndTrailerParams = {
        data,
        videoDoc,
    };
    const { landscape, portrait } = await _a._uploadAndSavePostersToDB(uploadPostersParams, session);
    await _a._uploadVidAndTrailer(uploadVidAndTrailerParams, session);
    videoDoc.landscape_photo = landscape._id;
    videoDoc.portrait_photo = portrait._id;
    await videoDoc.save({ session });
    return videoDoc;
};
UploadMediaUtils._editVideoSession = async ({ data, adminId, videoId }, session) => {
    _a._validateAddVideoFileTypes(data);
    const vod = await videos_model_1.VideoModel.findById(videoId);
    if (vod == null) {
        throw new OperationalError_1.OperationalError('invalid video id', 404);
    }
    vod.description = data.description || vod.description;
    vod.amount = data.amount || vod.amount;
    vod.title = data.title || vod.title;
    vod.upcoming = data.upcoming || vod.upcoming;
    vod.admin_id = (0, VideoRepo_1.toObjectId)(adminId);
    vod.description = data.description || vod.description;
    vod.vid_class = data.vidClass || vod.vid_class;
    vod.artist_name = data.artistName || vod.artist_name;
    vod.pg = data.pg || vod.pg;
    const addToSet = (prevs, additions) => {
        if (!prevs)
            return [...new Set(additions)].map(VideoRepo_1.toObjectId);
        return [...new Set([...prevs.map(e => e.toString()), ...additions])].map(VideoRepo_1.toObjectId);
    };
    if (data.genre) {
        vod.genre = addToSet(vod.genre, data.genre);
    }
    if (data.category) {
        vod.category = addToSet(vod.category, data.category);
    }
    if (data.cast) {
        vod.cast = addToSet(vod.cast, data.cast);
    }
    vod.default_rating = data.defaultRating ? Number(data.defaultRating) : vod.default_rating;
    vod.released_date = data.releasedDate ? new Date(data.releasedDate) : vod.released_date;
    vod.expiry_date = data.expiryDate ? new Date(data.expiryDate) : vod.expiry_date;
    vod.videoLink = data.videoLink || vod.videoLink;
    vod.trailerLink = data.trailerLink || vod.trailerLink;
    vod.runtime = data.runtime || vod.runtime;
    vod.active = data.active || vod.active;
    vod.showViews = data.showViews || vod.showViews;
    vod.upcoming = data.upcoming || vod.upcoming;
    let prevTrailerId = null;
    let prevPortraitPoster = null;
    let prevLandscapePoster = null;
    let prevVideoUploadId = null;
    if (data.portraitPoster) {
        const newPosterUpload = await media_management_1.MediaManagement.store({
            file: data.portraitPoster,
            expire: undefined,
            baseDir: 'images',
        });
        const posterDoc = await new poster_model_1.PosterImageModel({
            video_id: vod._id,
            bucket: newPosterUpload.Bucket,
            key: newPosterUpload.Key,
            dimension: 'portrait',
            parentType: 'vod',
        }).save({ session });
        prevPortraitPoster = vod.portrait_photo;
        vod.portrait_photo = posterDoc._id;
    }
    if (data.landscapePoster) {
        const newLandscapePoster = await media_management_1.MediaManagement.store({
            file: data.landscapePoster,
            expire: undefined,
            baseDir: 'images',
        });
        const landscapeDoc = await new poster_model_1.PosterImageModel({
            video_id: vod._id,
            bucket: newLandscapePoster.Bucket,
            key: newLandscapePoster.Key,
            dimension: 'landscape',
            parentType: 'vod',
        }).save({ session });
        prevLandscapePoster = vod.landscape_photo;
        vod.landscape_photo = landscapeDoc._id;
    }
    if (data.video) {
        prevVideoUploadId = vod.video_upload;
        const vidoeUpload = await media_management_1.MediaManagement.store({
            file: data.video,
            expire: vod.expiry_date ?? undefined,
            baseDir: 'videos',
        });
        const vidUploadDoc = await new videoupload_model_1.VideoUploadModel({
            bucket: vidoeUpload.Bucket,
            key: vidoeUpload.Key,
            mimetype: vidoeUpload.mimetype,
            size: vidoeUpload.size,
            parentType: 'vod',
            parentId: vod._id,
        }).save({ session });
        vod.videoLink = null;
        vod.video_upload = vidUploadDoc._id;
    }
    if (data.trailer) {
        prevTrailerId = vod.trailer_upload;
        const trailerVideoUpload = await media_management_1.MediaManagement.store({
            file: data.trailer,
            expire: undefined,
            baseDir: 'videos',
        });
        const trailerDoc = new trailer_model_1.TrailerModel({
            video_id: vod._id,
            parentType: 'vod',
        });
        const trailerVideoUploadDoc = await new videoupload_model_1.VideoUploadModel({
            bucket: trailerVideoUpload.Bucket,
            key: trailerVideoUpload.Key,
            mimetype: trailerVideoUpload.mimetype,
            size: trailerVideoUpload.size,
            parentType: 'trailer',
            parentId: trailerDoc._id,
        }).save({ session });
        trailerDoc.video_upload = trailerVideoUploadDoc._id;
        vod.trailerLink = null;
        await trailerDoc.save({ session });
    }
    await vod.save({ session });
    if (prevPortraitPoster)
        Purge_1.Purge.posterById(prevPortraitPoster);
    if (prevLandscapePoster)
        Purge_1.Purge.posterById(prevLandscapePoster);
    if (prevTrailerId)
        Purge_1.Purge.trailerById(prevTrailerId);
    if (prevVideoUploadId)
        Purge_1.Purge.videoUploadById(prevVideoUploadId);
    return vod;
};
UploadMediaUtils._validateWithMovieAndPrevSeasonsAggrResult = (res) => {
    if (res.length === 0) {
        throw new OperationalError_1.OperationalError('invalid videoId', 404);
    }
    const { totalEpisodesOfLastSeason, movieExpiryDate, totalPreviousSeasons, isMovieSeries } = res[0];
    if (!isMovieSeries) {
        throw new OperationalError_1.OperationalError('movie is not a series', 403);
    }
    if (totalPreviousSeasons > 0 && totalEpisodesOfLastSeason === 0) {
        throw new OperationalError_1.OperationalError('Creating a new season when the most recent season has no episodes is not allowed', 403);
    }
    if (movieExpiryDate && new Date() > movieExpiryDate) {
        throw new OperationalError_1.OperationalError('Movie has expired', 403);
    }
};
UploadMediaUtils._validateWithSeasonAndPrevEpisodes = (aggrRes) => {
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
UploadMediaUtils._addEpisodesWithSession = async ({ seasonId, data, adminId }, session) => {
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
