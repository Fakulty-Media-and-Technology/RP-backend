"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpcomingMediaSourceUtils = void 0;
const MovieMediaSourcesUtils_1 = require("./MovieMediaSourcesUtils");
const promises_1 = require("./promises");
class UpcomingMediaSourceUtils extends MovieMediaSourcesUtils_1.MovieMediaSourcesUtils {
}
exports.UpcomingMediaSourceUtils = UpcomingMediaSourceUtils;
_a = UpcomingMediaSourceUtils;
UpcomingMediaSourceUtils.resolveSources = async (upcomings, quality) => {
    const upsWithSources = await Promise.allSettled(upcomings.map(async (upcoming) => {
        const { landscapePhoto, portraitPhoto } = await _a._getMoviePhotos(upcoming);
        Object.assign(upcoming, {
            landscapePhoto,
            portraitPhoto,
            trailer: _a._getMovieVideoSource(upcoming, 'trailer', quality),
            trailerVideoUpload: undefined,
            peviewTrailer: undefined,
            trailerLink: undefined,
        });
        return upcoming;
    }));
    return (0, promises_1.getPromiseAllFulfilledResults)(upsWithSources);
};
