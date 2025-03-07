"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveRepo = void 0;
const lives_model_1 = require("../models/lives.model");
const QueryParamsFeatures_1 = require("../utils/QueryParamsFeatures");
const VideoRepo_1 = require("./VideoRepo");
class LiveRepo {
}
exports.LiveRepo = LiveRepo;
_a = LiveRepo;
LiveRepo.addFeatured = (id, expiry) => {
    return lives_model_1.LiveModel.findByIdAndUpdate(id, {
        featured: true,
        feat_expiry: new Date(expiry),
    });
};
LiveRepo.totalActiveLiveQuery = () => lives_model_1.LiveModel.find({ active: true });
LiveRepo.fetchActiveUpcoming = async (page, limit) => {
    return await _a.fetchLivesAggr({
        prevStages: [{ $match: { upcoming: true, active: true } }],
        page,
        limit,
    });
};
LiveRepo.fetchUpcoming = async (page, limit) => {
    return await _a.fetchLivesAggr({
        prevStages: [{ $match: { upcoming: true } }],
        page,
        limit,
    });
};
LiveRepo.getByStreamKey = async (streamKey) => {
    return await _a.fetchLivesAggr({
        prevStages: [
            {
                $match: { stream_key: streamKey },
            },
        ],
        page: 1,
        limit: 1,
    });
};
LiveRepo.getChannels = async (page = 1, limit = 10) => {
    return await _a.fetchLivesAggr({
        prevStages: [
            {
                $match: {
                    type: 'channel',
                },
            },
        ],
        page,
        limit,
    });
};
LiveRepo.searchLivesByTextReg = async (textReg, page = 1, limit = 10) => {
    return await _a.fetchLivesAggr({
        prevStages: [
            {
                $match: {
                    $or: [
                        { title: { $regex: textReg } },
                        { sub_title: { $regex: textReg } },
                        { description: { $regex: textReg } },
                    ],
                },
            },
        ],
        page,
        limit,
    });
};
LiveRepo.getFeatured = async (page = 1, limit = 10) => {
    return await _a.fetchLivesAggr({
        prevStages: [{ $match: { featured: true, expired: false } }],
        page,
        limit,
    });
};
LiveRepo.getActiveById = async (id, page = 1, limit = 10) => {
    return await _a.fetchLivesAggr({
        prevStages: [{ $match: { _id: (0, VideoRepo_1.toObjectId)(id), active: true } }],
        page,
        limit,
    });
};
LiveRepo.getValidClientLive = async (clientId, page = 1, limit = 10) => {
    return await _a.fetchLivesAggr({
        prevStages: [
            {
                $match: {
                    client_id: (0, VideoRepo_1.toObjectId)(clientId),
                    expired: false,
                },
            },
        ],
        page,
        limit,
    });
};
LiveRepo.getSelectedLive = async (filter, page = 1, limit = 10) => {
    return await _a.fetchLivesAggr({
        prevStages: [{ $match: filter }],
        page,
        limit,
    });
};
LiveRepo.fetchLivesByType = async (type, page, limit) => {
    return _a.fetchLivesAggr({
        prevStages: [{ $match: { type } }],
        sortStage: { $sort: { createdAt: -1 } },
        page,
        limit,
    });
};
LiveRepo.fetchLivesAggr = async ({ prevStages, sortStage, page, limit }) => {
    const sortPaginateStages = [
        sortStage ?? { $sort: { _id: -1 } },
        { $skip: (0, QueryParamsFeatures_1.skip)(page, limit) },
        { $limit: limit },
    ];
    const aggr = await lives_model_1.LiveModel.aggregate([
        ...prevStages,
        {
            $lookup: {
                from: 'poster_images',
                localField: '_id',
                foreignField: 'video_id',
                as: 'coverPhoto',
                pipeline: [{ $project: { key: true, bucket: true } }],
            },
        },
        {
            $lookup: {
                from: 'video_uploads',
                localField: '_id',
                foreignField: 'parentId',
                as: 'previewVideoUploads',
                pipeline: [
                    { $match: { isTranscoded: true } },
                    { $project: { key: true, isTranscoded: true, resolutions: true } },
                ],
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
                streamKey: '$stream_key',
                vidClass: '$vid_class',
                coverPhoto: { $first: '$coverPhoto' },
                previewVideoUploadDoc: { $ifNull: [{ $first: '$previewVideoUploads' }, null] },
                activeViews: '$active_views',
                featExpiry: '$feat_expiry',
                clientId: '$client_id',
            },
        },
        {
            $match: {
                $or: [{ previewVideoUpload: null }, { previewVideoUploadDoc: { $ne: null } }],
            },
        },
        ...sortPaginateStages,
        {
            $project: {
                views: false,
                previewVideoUploads: false,
                previewVideoUpload: false,
                stream_key: false,
                vid_class: false,
                feat_expiry: false,
                active_views: false,
                client_id: false,
                __v: false,
            },
        },
    ]);
    return aggr;
};
LiveRepo.getMostEngaged = async (page = 1, limit = 5) => {
    return await _a.fetchLivesAggr({
        prevStages: [
            {
                $lookup: {
                    from: 'comments',
                    foreignField: 'parentId',
                    localField: '_id',
                    as: 'comments',
                    pipeline: [{ $match: { parentType: 'live' } }],
                },
            },
            {
                $lookup: {
                    from: 'ratings',
                    foreignField: 'parentId',
                    localField: '_id',
                    as: 'ratings',
                    pipeline: [
                        { $match: { parentType: 'live' } },
                        { $group: { _id: null, totalRatings: { $sum: '$rate' } } },
                    ],
                },
            },
            {
                $lookup: {
                    from: 'votes',
                    foreignField: 'live_id',
                    localField: '_id',
                    as: 'votes',
                },
            },
            {
                $lookup: {
                    from: 'donates',
                    foreignField: 'live_id',
                    localField: '_id',
                    as: 'donations',
                },
            },
            {
                $addFields: {
                    engagements: {
                        $sum: [
                            { $size: '$views' },
                            { $size: '$donations' },
                            { $size: '$votes' },
                            { $size: '$comments' },
                            { $ifNull: [{ $first: '$ratings.totalRatings' }, 0] },
                        ],
                    },
                },
            },
            { $sort: { engagements: -1 } },
            { $limit: 10 },
            {
                $project: {
                    donations: false,
                    comments: false,
                    ratings: false,
                    votes: false,
                    __v: false,
                },
            },
        ],
        page,
        limit,
    });
};
