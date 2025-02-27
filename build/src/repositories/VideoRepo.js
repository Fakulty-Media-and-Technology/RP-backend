"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoRepo = exports.toObjectId = void 0;
const mongoose_1 = require("mongoose");
const videos_model_1 = require("../models/videos.model");
const QueryParamsFeatures_1 = require("../utils/QueryParamsFeatures");
const seasons_model_1 = require("../models/seasons.model");
const toObjectId = (val) => new mongoose_1.Types.ObjectId(val);
exports.toObjectId = toObjectId;
class VideoRepo {
}
exports.VideoRepo = VideoRepo;
_a = VideoRepo;
VideoRepo.addFeatured = (id, expiry) => videos_model_1.VideoModel.findByIdAndUpdate(id, {
    featured: true,
    feat_expiry: new Date(expiry),
});
VideoRepo.totalVideosCountQuery = (filter = {}) => videos_model_1.VideoModel.find(filter).countDocuments();
VideoRepo.totalMovieSeriesCountQuery = () => _a.totalVideosCountQuery({ type: { $in: ['movie', 'series'] } });
VideoRepo.totalMusicVideosCountQuery = () => _a.totalVideosCountQuery({ type: 'music-video' });
VideoRepo.totalSkitVideosCOuntQuery = () => _a.totalVideosCountQuery({ type: 'skit' });
VideoRepo.addSeasonUtilAggr = async (vidId) => {
    const aggr = await videos_model_1.VideoModel.aggregate([
        { $match: { _id: (0, exports.toObjectId)(vidId) } },
        {
            $lookup: {
                from: 'seasons',
                localField: '_id',
                foreignField: 'video',
                as: 'seasons',
                pipeline: [
                    { $sort: { _id: -1 } },
                    {
                        $lookup: {
                            from: 'episodes',
                            localField: '_id',
                            foreignField: 'season',
                            as: 'episodes',
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: 'trailers',
                localField: '_id',
                foreignField: 'video_id',
                as: 'trailers',
                pipeline: [
                    {
                        $lookup: {
                            from: 'video_uploads',
                            localField: 'video_upload',
                            foreignField: '_id',
                            as: 'trailerVideUploads',
                        },
                    },
                    {
                        $addFields: {
                            isTrailerVidUploadTranscoded: {
                                $ifNull: [{ $first: '$trailerVideUploads.isTranscoded' }, null],
                            },
                        },
                    },
                ],
            },
        },
        {
            $project: {
                totalPreviousSeasons: { $size: '$seasons' },
                totalEpisodesOfLastSeason: { $size: { $ifNull: [{ $first: '$seasons.episodes' }, []] } },
                isMovieSeries: '$is_series',
                movieExpiryDate: { $ifNull: ['$expiry_date', undefined] },
                movieTrailerLink: { $ifNull: ['$trailerLink', null] },
                isMovieTrailerVidUploadTranscoded: {
                    $ifNull: [{ $first: '$trailers.isTrailerVidUploadTranscoded' }, null],
                },
            },
        },
    ]);
    return aggr;
};
VideoRepo.addEpisodeUtilAggr = async (seasonId) => {
    const seasonTrailerLookupStage = {
        $lookup: {
            from: 'trailers',
            localField: 'trailer',
            foreignField: '_id',
            as: 'trailer',
            pipeline: [
                {
                    $lookup: {
                        from: 'video_uploads',
                        localField: 'video_upload',
                        foreignField: '_id',
                        as: 'trailerVidUpload',
                    },
                },
                {
                    $addFields: {
                        isTrailerVidTranscoded: {
                            $ifNull: [{ $first: '$trailerVidUpload.isTranscoded' }, null],
                        },
                    },
                },
            ],
        },
    };
    const episodesLookupStage = {
        $lookup: {
            from: 'episodes',
            localField: '_id',
            foreignField: 'season',
            as: 'episodes',
            pipeline: [
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: 'video_uploads',
                        localField: 'videoUpload',
                        foreignField: '_id',
                        as: 'videoUploads',
                    },
                },
                {
                    $lookup: {
                        from: 'trailers',
                        localField: 'trailerUpload',
                        foreignField: '_id',
                        as: 'episodeTrailers',
                        pipeline: [
                            {
                                $lookup: {
                                    from: 'video_uploads',
                                    localField: 'video_upload',
                                    foreignField: '_id',
                                    as: 'episodeTrailerVidUpload',
                                },
                            },
                            {
                                $addFields: {
                                    isEpisodeTrailerVidTranscoded: {
                                        $ifNull: [{ $first: '$episodeTrailerVidUpload.isTranscoded' }, null],
                                    },
                                },
                            },
                        ],
                    },
                },
                {
                    $addFields: {
                        isEpisodeVidUploadTranscoded: {
                            $ifNull: [{ $first: '$videoUploads.isTranscoded' }, null],
                        },
                        isTrailerVidUploadTranscoded: {
                            $ifNull: [{ $first: '$episodeTrailers.isEpisodeTrailerVidTranscoded' }, null],
                        },
                    },
                },
            ],
        },
    };
    const aggr = await seasons_model_1.SeasonModel.aggregate([
        { $match: { _id: (0, exports.toObjectId)(seasonId) } },
        seasonTrailerLookupStage,
        episodesLookupStage,
        {
            $project: {
                seasonTrailerLink: '$trailerLink',
                recentEpisodeTrailerLink: {
                    $ifNull: [{ $first: '$episodes.trailerLink' }, null],
                },
                recentEpisodeVideoLink: {
                    $ifNull: [{ $first: '$episodes.videoLink' }, null],
                },
                isTrailerUploadVidTranscoded: {
                    $ifNull: [{ $first: '$trailer.isTrailerVidTranscoded' }, null],
                },
                isRecentEpisodeTrailerVidUploadTranscoded: {
                    $ifNull: [{ $first: '$episodes.isTrailerVidUploadTranscoded' }, null],
                },
                isRecentEpisodeVidUploadTranscoded: {
                    $ifNull: [{ $first: '$episodes.isEpisodeVidUploadTranscoded' }, null],
                },
                totalPreviousEpisodes: { $size: '$episodes' },
            },
        },
    ]);
    return aggr;
};
VideoRepo.searchTitleOrDescriptionByTextReg = async (textReg, page = 1, limit = 10) => {
    return await _a.fetchVideoAggr({
        prevStages: [
            {
                $match: {
                    $or: [{ title: { $regex: textReg } }, { description: { $regex: textReg } }],
                },
            },
        ],
        sortStage: { $sort: { createdAt: -1 } },
        page,
        limit,
    });
};
VideoRepo._mostEngagedPrevStages = [
    {
        $lookup: {
            from: 'comments',
            foreignField: 'parentId',
            localField: '_id',
            as: 'comments',
            pipeline: [{ $match: { parentType: 'vod' } }],
        },
    },
    {
        $lookup: {
            from: 'ratings',
            foreignField: 'parentId',
            localField: '_id',
            as: 'ratings',
            pipeline: [
                { $match: { parentType: 'vod' } },
                { $group: { _id: null, totalRatings: { $sum: '$rate' } } },
            ],
        },
    },
    {
        $addFields: {
            enagements: {
                $sum: [
                    { $size: '$likes' },
                    { $size: '$comments' },
                    { $ifNull: [{ $first: '$ratings.totalRatings' }, 0] },
                ],
            },
        },
    },
    { $sort: { enagements: -1 } },
    { $project: { ratings: false, comments: false, __v: false } },
];
VideoRepo._episodesPipeline = [
    {
        $lookup: {
            from: 'sub_titles',
            localField: '_id',
            foreignField: 'video_id',
            as: 'subtitle',
            pipeline: [{ $project: { key: true, bucket: true, language: true } }],
        },
    },
    {
        $lookup: {
            from: 'video_uploads',
            localField: '_id',
            foreignField: 'parentId',
            as: 'videoUpload',
            pipeline: [
                { $match: { isTranscoded: true } },
                { $project: { key: true, isTranscoded: true, resolutions: true } },
            ],
        },
    },
    {
        $lookup: {
            from: 'trailers',
            localField: '_id',
            foreignField: 'video_id',
            as: 'trailer',
            pipeline: [
                {
                    $lookup: {
                        from: 'video_uploads',
                        localField: '_id',
                        foreignField: 'parentId',
                        as: 'trailerVideoUpload',
                        pipeline: [
                            { $match: { isTranscoded: true } },
                            { $project: { key: true, isTranscoded: true, resolutions: true } },
                        ],
                    },
                },
                { $addFields: { trailerVideoUpload: { $first: '$trailerVideoUpload' } } },
            ],
        },
    },
    {
        $lookup: {
            from: 'ratings',
            foreignField: 'parentId',
            localField: '_id',
            as: 'ratings',
            pipeline: [{ $group: { _id: null, avgRating: { $avg: '$rate' } } }],
        },
    },
    {
        $lookup: {
            from: 'views',
            foreignField: 'content',
            localField: '_id',
            as: 'views',
        },
    },
    {
        $addFields: {
            viewsCount: { $size: '$views' },
            trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
            videoUpload: { $ifNull: [{ $first: '$videoUpload' }, null] },
            subtitle: { $first: '$subtitle' },
            averageRating: { $ifNull: [{ $first: '$ratings.avgRating' }, 4.5] },
        },
    },
    {
        $project: {
            __v: false,
            ratings: false,
            views: false,
            trailer: false,
            subtitleUpload: false,
            trailerUpload: false,
        },
    },
];
VideoRepo._seasonPipeline = [
    {
        $lookup: {
            from: 'poster_images',
            localField: '_id',
            foreignField: 'video_id',
            as: 'landscapePhoto',
            pipeline: [
                { $match: { dimension: 'landscape' } },
                { $project: { key: true, bucket: true } },
            ],
        },
    },
    {
        $lookup: {
            from: 'poster_images',
            localField: '_id',
            foreignField: 'video_id',
            as: 'portraitPhoto',
            pipeline: [
                { $match: { dimension: 'portrait' } },
                { $project: { key: true, bucket: true } },
            ],
        },
    },
    {
        $lookup: {
            from: 'trailers',
            localField: '_id',
            foreignField: 'video_id',
            as: 'trailer',
            pipeline: [
                {
                    $lookup: {
                        from: 'video_uploads',
                        localField: '_id',
                        foreignField: 'parentId',
                        as: 'trailerVideoUpload',
                        pipeline: [{ $project: { key: true, isTranscoded: true, resolutions: true } }],
                    },
                },
                { $addFields: { trailerVideoUpload: { $first: '$trailerVideoUpload' } } },
            ],
        },
    },
    {
        $lookup: {
            from: 'episodes',
            localField: '_id',
            foreignField: 'season',
            as: 'episodes',
            pipeline: _a._episodesPipeline,
        },
    },
    {
        $lookup: {
            from: 'views',
            foreignField: 'content',
            localField: '_id',
            as: 'views',
        },
    },
    {
        $addFields: {
            viewsCount: { $size: '$views' },
            trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
            portraitPhoto: { $first: '$portraitPhoto' },
            landscapePhoto: { $first: '$landscapePhoto' },
        },
    },
    { $sort: { createdAt: -1 } },
    { $project: { __v: false, trailer: false, views: false } },
];
VideoRepo.fetchSeasonsAndEpisodes = async (videoId, page, limit) => {
    const aggr = await seasons_model_1.SeasonModel.aggregate([
        {
            $match: { video: (0, exports.toObjectId)(videoId) },
        },
        ..._a._seasonPipeline,
        {
            $lookup: {
                from: 'episodes',
                localField: '_id',
                foreignField: 'season',
                as: 'episodes',
                pipeline: _a._episodesPipeline,
            },
        },
        { $sort: { createdAt: 1 } },
        { $skip: (0, QueryParamsFeatures_1.skip)(page, limit) },
        { $limit: limit },
    ]);
    return aggr;
};
VideoRepo.fetchVideoAggr = async ({ prevStages, sortStage, page, limit }) => {
    const enumsProjectShared = {
        $project: { __v: false, createdAt: false, updatedAt: false },
    };
    const sortPaginateStages = [{ $skip: (0, QueryParamsFeatures_1.skip)(page, limit) }, { $limit: limit }];
    if (sortStage)
        sortPaginateStages.unshift(sortStage);
    const aggr = await videos_model_1.VideoModel.aggregate([
        ...prevStages,
        {
            $lookup: {
                from: 'poster_images',
                localField: '_id',
                foreignField: 'video_id',
                as: 'landscapePhoto',
                pipeline: [
                    { $match: { dimension: 'landscape' } },
                    { $project: { key: true, bucket: true } },
                ],
            },
        },
        {
            $lookup: {
                from: 'poster_images',
                localField: '_id',
                foreignField: 'video_id',
                as: 'portraitPhoto',
                pipeline: [
                    { $match: { dimension: 'portrait' } },
                    { $project: { key: true, bucket: true } },
                ],
            },
        },
        {
            $lookup: {
                from: 'video_uploads',
                localField: '_id',
                foreignField: 'parentId',
                as: 'videoUpload',
                pipeline: [
                    { $match: { isTranscoded: true } },
                    { $project: { key: true, isTranscoded: true, resolutions: true } },
                ],
            },
        },
        {
            $lookup: {
                from: 'genre_enums',
                foreignField: '_id',
                localField: 'genre',
                as: 'genre',
                pipeline: [enumsProjectShared],
            },
        },
        {
            $lookup: {
                from: 'category_enums',
                foreignField: '_id',
                localField: 'category',
                as: 'category',
                pipeline: [enumsProjectShared],
            },
        },
        {
            $lookup: {
                from: 'cast_enums',
                foreignField: '_id',
                localField: 'cast',
                as: 'cast',
                pipeline: [enumsProjectShared],
            },
        },
        {
            $lookup: {
                from: 'sub_titles',
                localField: '_id',
                foreignField: 'video_id',
                as: 'subtitle',
                pipeline: [{ $project: { key: true, bucket: true, language: true } }],
            },
        },
        {
            $lookup: {
                from: 'trailers',
                localField: '_id',
                foreignField: 'video_id',
                as: 'trailer',
                pipeline: [
                    {
                        $lookup: {
                            from: 'video_uploads',
                            localField: '_id',
                            foreignField: 'parentId',
                            as: 'trailerVideoUpload',
                            pipeline: [
                                { $match: { isTranscoded: true } },
                                { $project: { key: true, isTranscoded: true, resolutions: true } },
                            ],
                        },
                    },
                    { $addFields: { trailerVideoUpload: { $first: '$trailerVideoUpload' } } },
                ],
            },
        },
        {
            $lookup: {
                from: 'ratings',
                foreignField: 'parentId',
                localField: '_id',
                as: 'ratings',
                pipeline: [{ $group: { _id: null, avgRating: { $avg: '$rate' } } }],
            },
        },
        {
            $lookup: {
                from: 'views',
                foreignField: 'content',
                localField: '_id',
                as: 'views',
            },
        },
        {
            $addFields: {
                viewsCount: { $size: '$views' },
                vidClass: '$vid_class',
                artistName: '$artist_name',
                releaseDate: '$released_date',
                expiryDate: '$expiry_date',
                defaultRating: '$default_rating',
                trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
                videoUpload: { $ifNull: [{ $first: '$videoUpload' }, null] },
                portraitPhoto: { $first: '$portraitPhoto' },
                landscapePhoto: { $first: '$landscapePhoto' },
                subtitle: { $first: '$subtitle' },
                averageRating: { $ifNull: [{ $first: '$ratings.avgRating' }, 4.5] },
            },
        },
        {
            $match: {
                $or: [
                    // series can have vids and trailers properties as as null
                    { is_series: true },
                    // TODO: find a coincise way
                    {
                        // videoLink and videoUpload are not null on the same document
                        // trailerLink and trailerVideoUpload are not null on the same document
                        $and: [
                            {
                                $or: [
                                    { $and: [{ videoLink: { $ne: null } }, { videoUpload: null }] },
                                    { $and: [{ videoLink: null }, { videoUpload: { $ne: null } }] },
                                ],
                            },
                            {
                                $or: [
                                    { $and: [{ trailerLink: { $ne: null } }, { trailerVideoUpload: null }] },
                                    { $and: [{ trailerLink: null }, { trailerVideoUpload: { $ne: null } }] },
                                ],
                            },
                        ],
                    },
                ],
            },
        },
        ...sortPaginateStages,
        {
            $lookup: {
                from: 'seasons',
                localField: '_id',
                foreignField: 'video',
                as: 'seasons',
                pipeline: _a._seasonPipeline,
            },
        },
        {
            $project: {
                expiry_date: false,
                views: false,
                released_date: false,
                artist_name: false,
                subtitle_upload: false,
                vid_class: false,
                default_rating: false,
                ratings: false,
                is_series: false,
                trailer: false,
                trailer_upload: false,
                landscape_photo: false,
                portrait_photo: false,
                video_upload: false,
                __v: false,
                updatedAt: false,
            },
        },
    ]);
    return aggr;
};
VideoRepo.fetchByType = async (type, page = 1, limit = 20) => {
    return await _a.fetchVideoAggr({
        prevStages: [{ $match: { type } }],
        sortStage: { $sort: { createdAt: -1 } },
        page,
        limit,
    });
};
VideoRepo.fetchById = async (id) => {
    return await _a.fetchVideoAggr({
        prevStages: [{ $match: { _id: (0, exports.toObjectId)(id) } }],
        page: 1,
        limit: 1,
    });
};
VideoRepo.fetchFeatured = async (page = 1, limit = 10) => {
    return await _a.fetchVideoAggr({
        prevStages: [{ $match: { featured: true } }],
        // sortStage: { $sort: { $natural: -1 } },
        page,
        limit,
    });
};
VideoRepo.fetchMostEngaged = async (page = 1, limit = 5) => {
    return await _a.fetchVideoAggr({
        prevStages: _a._mostEngagedPrevStages,
        sortStage: { $sort: { enagements: -1 } },
        page,
        limit,
    });
};
