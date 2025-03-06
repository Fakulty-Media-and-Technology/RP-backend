"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieMediaSourcesUtils = void 0;
const media_access_1 = require("../services/media-access");
const OperationalError_1 = require("./OperationalError");
const promises_1 = require("./promises");
const VideoUploadUtils_1 = require("./VideoUploadUtils");
class MovieMediaSourcesUtils {
}
exports.MovieMediaSourcesUtils = MovieMediaSourcesUtils;
_a = MovieMediaSourcesUtils;
MovieMediaSourcesUtils._getMoviePhotos = async (vid) => {
    const [landscapePhoto, portraitPhoto] = await Promise.all([
        media_access_1.MediaAccess.getSignedUrl(vid.landscapePhoto.bucket, vid.landscapePhoto.key, 'photo'),
        media_access_1.MediaAccess.getSignedUrl(vid.portraitPhoto.bucket, vid.portraitPhoto.key, 'photo'),
    ]);
    return { landscapePhoto, portraitPhoto };
};
MovieMediaSourcesUtils._getMovieVideoSource = (vid, routine, quality) => {
    switch (routine) {
        case 'vid':
            return vid.videoLink
                ? vid.videoLink
                : VideoUploadUtils_1.VidUploadUtils.getResSourceUrl(vid.videoUpload, quality);
        case 'trailer':
            return vid.trailerLink
                ? vid.trailerLink
                : VideoUploadUtils_1.VidUploadUtils.getResSourceUrl(vid.trailerVideoUpload, quality);
        default:
            throw new OperationalError_1.OperationalError('invalid getVideoSource routine', 500);
    }
};
MovieMediaSourcesUtils.resolveSeasonsMediaSources = async (seasons, withMediaSources, quality, episodesMediaResolver) => {
    const seasonsWithSources = await Promise.all(seasons.map(async (season) => {
        if (episodesMediaResolver) {
            season.episodes = await episodesMediaResolver(season.episodes, withMediaSources, quality);
        }
        return season;
    }));
    return seasonsWithSources;
};
MovieMediaSourcesUtils.resolveEpisodesMediaSources = async (episodes, withMediaSources, quality) => {
    const episodesWithSources = await Promise.all(episodes.map(async (episode) => {
        if (!withMediaSources)
            return;
        Object.assign(episode, {
            video: _a._getMovieVideoSource(episode, 'vid', quality),
            trailer: _a._getMovieVideoSource(episode, 'trailer', quality),
            trailerVideoUpload: undefined,
            videoUpload: undefined,
            trailerLink: undefined,
            videoLink: undefined,
        });
        return episode;
    }));
    return episodesWithSources;
};
MovieMediaSourcesUtils.resolveMediaSources = async (vids, withMediaSources, quality) => {
    const movies = await Promise.allSettled(vids.map(async (vid) => {
        const { landscapePhoto, portraitPhoto } = await _a._getMoviePhotos(vid);
        vid.seasons = await _a.resolveSeasonsMediaSources(vid.seasons, withMediaSources, quality, _a.resolveEpisodesMediaSources);
        Object.assign(vid, {
            landscapePhoto,
            portraitPhoto,
        });
        if (withMediaSources) {
            Object.assign(vid, {
                video: _a._getMovieVideoSource(vid, 'vid', quality),
                trailer: _a._getMovieVideoSource(vid, 'trailer', quality),
                trailerVideoUpload: undefined,
                videoUpload: undefined,
                trailerLink: undefined,
                videoLink: undefined,
            });
        }
        return vid;
    }));
    return (0, promises_1.getPromiseAllFulfilledResults)(movies);
};
