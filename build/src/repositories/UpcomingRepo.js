"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpcomingRepo = void 0;
const upcoming_model_1 = require("../models/upcoming.model");
const QueryParamsFeatures_1 = require("../utils/QueryParamsFeatures");
class UpcomingRepo {
}
exports.UpcomingRepo = UpcomingRepo;
_a = UpcomingRepo;
UpcomingRepo.fetchAggr = async ({ prevStages, page, limit }) => {
    const aggr = await upcoming_model_1.UpcomingModel.aggregate([
        ...prevStages,
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
                            as: 'trailerVideoUploads',
                            pipeline: [
                                { $match: { isTranscoded: true } },
                                { $project: { key: true, isTranscoded: true, resolutions: true } },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            trailerVideoUploadDoc: { $ifNull: [{ $first: '$trailerVideoUploads' }, null] },
                        },
                    },
                ],
            },
        },
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
                from: 'views',
                foreignField: 'content',
                localField: '_id',
                as: 'views',
            },
        },
        {
            $addFields: {
                viewsCount: { $size: '$views' },
                trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUploadDoc' }, null] },
                portraitPhoto: { $first: '$portraitPhoto' },
                landscapePhoto: { $first: '$landscapePhoto' },
            },
        },
        { $match: { $or: [{ peviewTrailer: null }, { trailerVideoUpload: { $ne: null } }] } },
        { $sort: { updatedAt: -1 } },
        { $skip: (0, QueryParamsFeatures_1.skip)(page, limit) },
        { $limit: limit },
        { $project: { __v: false, trailer: false, views: false } },
    ]);
    return aggr;
};
