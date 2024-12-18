"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUploadController = void 0;
const poster_model_1 = require("../../models/poster.model");
const videos_model_1 = require("../../models/videos.model");
const catchAsync_1 = require("../../utils/catchAsync");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
class AdminUploadController {
}
exports.AdminUploadController = AdminUploadController;
_a = AdminUploadController;
//MOVIES
AdminUploadController.addMovie = catchAsync_1.Catch.async(async (req, res) => {
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { title, sub_title, bucket, key, pg, vid_class, genre, category, cast, released_date, expiry_date, runtime, default_rating, poster1_data, poster2_data, } = req.body;
    if (!title ||
        !bucket ||
        !key ||
        !pg ||
        !vid_class ||
        !genre ||
        !category ||
        !cast ||
        !released_date ||
        !runtime ||
        !default_rating) {
        throw new OperationalError_1.OperationalError('all required fields are mandatory', 400);
    }
    if (!poster1_data.key ||
        !poster1_data.dimension ||
        !poster2_data.key ||
        !poster2_data.dimension) {
        throw new OperationalError_1.OperationalError('video poster details are required', 400);
    }
    const videoData = await new videos_model_1.VideoModel({
        admin_id: admin._id,
        title,
        sub_title,
        type: 'movie',
        bucket,
        key,
        pg,
        vid_class,
        genre,
        category,
        cast,
        released_date,
        expiry_date,
        runtime,
        default_rating,
        is_series: false,
    }).save();
    await new poster_model_1.PosterImageModel({
        video_id: videoData._id,
        bucket: poster1_data.bucket,
        key: poster1_data.key,
        dimension: poster1_data.dimension,
    }).save();
    await new poster_model_1.PosterImageModel({
        video_id: videoData._id,
        bucket: poster2_data.bucket,
        key: poster2_data.key,
        dimension: poster2_data.dimension,
    }).save();
    (0, responder_1.sendResponse)({
        res,
        message: 'movie added successfully',
    });
});
AdminUploadController.editMovie = catchAsync_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    const { title, sub_title, bucket, key, pg, vid_class, genre, category, cast, released_date, expiry_date, runtime, default_rating, } = req.body;
    const initData = await videos_model_1.VideoModel.findOne({ _id: vid_id });
    await videos_model_1.VideoModel.findOneAndUpdate({
        _id: vid_id,
        type: 'movie',
    }, {
        title: title ? title : initData?.title,
        sub_title: sub_title ? sub_title : initData?.sub_title,
        bucket: bucket ? bucket : initData?.bucket,
        key: key ? key : initData?.key,
        pg: pg ? pg : initData?.pg,
        vid_class: vid_class ? vid_class : initData?.vid_class,
        genre: genre ? genre : initData?.genre,
        category: category ? category : initData?.category,
        cast: cast ? cast : initData?.cast,
        released_date: released_date ? released_date : initData?.released_date,
        expiry_date: expiry_date ? expiry_date : initData?.expiry_date,
        runtime: runtime ? runtime : initData?.runtime,
        default_rating: default_rating ? default_rating : initData?.default_rating,
    }, {
        new: true,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'movie updated successfully',
    });
});
AdminUploadController.deleteMovie = catchAsync_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    (0, responder_1.sendResponse)({
        res,
        message: 'TODO',
    });
    //TODO delete S3 objecttsss
});
AdminUploadController.fetchMovies = catchAsync_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 10);
    const videos = await videos_model_1.VideoModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: ['$type', 'movie'],
                },
            },
        },
        {
            $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
            },
        },
        {
            $sort: {
                updatedAt: 1,
            },
        },
        {
            $skip: Number(page - 1) * Number(limit) || 0,
        },
        {
            $limit: Number(limit),
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: videos,
        message: 'movies fetched successfully',
    });
});
//SKITS
AdminUploadController.addSkit = catchAsync_1.Catch.async(async (req, res) => {
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { title, sub_title, bucket, key, pg, vid_class, genre, category, cast, released_date, expiry_date, runtime, default_rating, poster1_data, poster2_data, } = req.body;
    if (!title ||
        !bucket ||
        !key ||
        !pg ||
        !vid_class ||
        !genre ||
        !category ||
        !cast ||
        !released_date ||
        !runtime ||
        !default_rating) {
        throw new OperationalError_1.OperationalError('all required fields are mandatory', 400);
    }
    if (!poster1_data.key || !poster1_data.dimension) {
        throw new OperationalError_1.OperationalError('video poster details are required', 400);
    }
    if (!poster2_data.key || !poster2_data.dimension) {
        throw new OperationalError_1.OperationalError('video poster details are required', 400);
    }
    const videoData = await new videos_model_1.VideoModel({
        admin_id: admin._id,
        title,
        sub_title,
        type: 'skit',
        bucket,
        key,
        pg,
        vid_class,
        genre,
        category,
        cast,
        released_date,
        expiry_date,
        runtime,
        default_rating,
        is_series: false,
    }).save();
    // TODO: use session
    await new poster_model_1.PosterImageModel({
        video_id: videoData._id,
        bucket: poster1_data.bucket,
        key: poster1_data.key,
        dimension: poster1_data.dimension,
    }).save();
    await new poster_model_1.PosterImageModel({
        video_id: videoData._id,
        bucket: poster2_data.bucket,
        key: poster2_data.key,
        dimension: poster2_data.dimension,
    }).save();
    (0, responder_1.sendResponse)({
        res,
        message: 'Skit added successfully',
    });
});
AdminUploadController.editSkit = catchAsync_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    const { title, sub_title, bucket, key, pg, vid_class, genre, category, cast, released_date, expiry_date, runtime, default_rating, } = req.body;
    const initData = await videos_model_1.VideoModel.findOne({ _id: vid_id });
    await videos_model_1.VideoModel.findOneAndUpdate({
        _id: vid_id,
        type: 'skit',
    }, {
        title: title ? title : initData?.title,
        sub_title: sub_title ? sub_title : initData?.sub_title,
        bucket: bucket ? bucket : initData?.bucket,
        key: key ? key : initData?.key,
        pg: pg ? pg : initData?.pg,
        vid_class: vid_class ? vid_class : initData?.vid_class,
        genre: genre ? genre : initData?.genre,
        category: category ? category : initData?.category,
        cast: cast ? cast : initData?.cast,
        released_date: released_date ? released_date : initData?.released_date,
        expiry_date: expiry_date ? expiry_date : initData?.expiry_date,
        runtime: runtime ? runtime : initData?.runtime,
        default_rating: default_rating ? default_rating : initData?.default_rating,
    }, {
        new: true,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'skit updated successfully',
    });
});
AdminUploadController.deleteSkit = catchAsync_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    //TODO delete S3 objecttsss
    (0, responder_1.sendResponse)({
        res,
        message: 'TODO',
    });
});
AdminUploadController.fetchSkits = catchAsync_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 10);
    const videos = await videos_model_1.VideoModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: ['$type', 'skit'],
                },
            },
        },
        {
            $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
            },
        },
        {
            $sort: {
                updatedAt: 1,
            },
        },
        {
            $skip: (page - 1) * limit || 0,
        },
        {
            $limit: limit,
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        message: 'skits fetched successfully',
        data: videos,
    });
});
//Music Videos
AdminUploadController.addMusicVid = catchAsync_1.Catch.async(async (req, res) => {
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { title, sub_title, bucket, key, pg, vid_class, category, released_date, expiry_date, runtime, default_rating, artist_name, poster1_data, poster2_data, } = req.body;
    if (!title ||
        !bucket ||
        !key ||
        !pg ||
        !vid_class ||
        !category ||
        !released_date ||
        !runtime ||
        !artist_name ||
        !default_rating) {
        throw new OperationalError_1.OperationalError('All required feilds are mandatory', 400);
    }
    if (!poster1_data.key || !poster1_data.dimension) {
        throw new OperationalError_1.OperationalError('video poster details are required', 400);
    }
    if (!poster2_data.key || !poster2_data.dimension) {
        throw new OperationalError_1.OperationalError('video poster details are required', 400);
    }
    const videoData = await new videos_model_1.VideoModel({
        admin_id: admin._id,
        title,
        sub_title,
        type: 'music video',
        bucket,
        key,
        pg,
        vid_class,
        category,
        artist_name,
        released_date,
        expiry_date,
        runtime,
        default_rating,
        is_series: false,
    }).save();
    await new poster_model_1.PosterImageModel({
        video_id: videoData._id,
        bucket: poster1_data.bucket,
        key: poster1_data.key,
        dimension: poster1_data.dimension,
    }).save();
    await new poster_model_1.PosterImageModel({
        video_id: videoData._id,
        bucket: poster2_data.bucket,
        key: poster2_data.key,
        dimension: poster2_data.dimension,
    }).save();
    (0, responder_1.sendResponse)({
        res,
        message: 'Music Video added successfully',
    });
});
AdminUploadController.editMusicVid = catchAsync_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    const { title, sub_title, bucket, key, pg, vid_class, artist_name, category, released_date, expiry_date, runtime, default_rating, } = req.body;
    const initData = await videos_model_1.VideoModel.findOne({ _id: vid_id });
    await videos_model_1.VideoModel.findOneAndUpdate({
        _id: vid_id,
        type: 'music video',
    }, {
        title: title ? title : initData?.title,
        sub_title: sub_title ? sub_title : initData?.sub_title,
        bucket: bucket ? bucket : initData?.bucket,
        key: key ? key : initData?.key,
        pg: pg ? pg : initData?.pg,
        vid_class: vid_class ? vid_class : initData?.vid_class,
        category: category ? category : initData?.category,
        artist_name: artist_name ? artist_name : initData?.artist_name,
        released_date: released_date ? released_date : initData?.released_date,
        expiry_date: expiry_date ? expiry_date : initData?.expiry_date,
        runtime: runtime ? runtime : initData?.runtime,
        default_rating: default_rating ? default_rating : initData?.default_rating,
    }, {
        new: true,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'Music Video updated successfully',
    });
});
AdminUploadController.deleteMusicVid = catchAsync_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    //TODO delete S3 objecttsss
    (0, responder_1.sendResponse)({
        res,
        message: 'TODO',
    });
    // await VideoModel.findOneAndDelete({_id: vid_id})
});
AdminUploadController.fetchMusicVid = catchAsync_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 10);
    const videos = await videos_model_1.VideoModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: ['$type', 'music_video'],
                },
            },
        },
        {
            $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
            },
        },
        {
            $sort: {
                updatedAt: 1,
            },
        },
        {
            $skip: (page - 1) * limit || 0,
        },
        {
            $limit: limit,
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: videos,
        message: 'Music Video fetched successfully',
    });
});
//Series
AdminUploadController.addSeries = catchAsync_1.Catch.async(async (req, res) => {
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user);
    const { title, sub_title, pg, vid_class, category, genre, cast, released_date, expiry_date, runtime, episodes, default_rating, poster1_data, poster2_data, } = req.body;
    if (!title ||
        !pg ||
        !vid_class ||
        !category ||
        !genre ||
        !cast ||
        !released_date ||
        !runtime ||
        !episodes ||
        !default_rating) {
        throw new OperationalError_1.OperationalError('video poster details are required', 400);
    }
    if (!poster1_data.key || !poster1_data.dimension) {
        throw new OperationalError_1.OperationalError('video poster details are required', 400);
    }
    if (!poster2_data.key || !poster2_data.dimension) {
        throw new OperationalError_1.OperationalError('video poster details are required', 400);
    }
    // TODO: Use Session
    const videoData = await new videos_model_1.VideoModel({
        admin_id: admin._id,
        title,
        sub_title,
        type: 'series',
        pg,
        vid_class,
        category,
        released_date,
        expiry_date,
        runtime,
        default_rating,
        is_series: true,
        episodes,
    }).save();
    await new poster_model_1.PosterImageModel({
        video_id: videoData._id,
        bucket: poster1_data.bucket,
        key: poster1_data.key,
        dimension: poster1_data.dimension,
    }).save();
    await new poster_model_1.PosterImageModel({
        video_id: videoData._id,
        bucket: poster2_data.bucket,
        key: poster2_data.key,
        dimension: poster2_data.dimension,
    }).save();
    (0, responder_1.sendResponse)({
        res,
        message: 'Series added successfully',
    });
});
AdminUploadController.editSeries = catchAsync_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    const { title, sub_title, pg, vid_class, category, genre, cast, released_date, expiry_date, runtime, episodes, default_rating, } = req.body;
    const initData = await videos_model_1.VideoModel.findOne({ _id: vid_id });
    await videos_model_1.VideoModel.findOneAndUpdate({
        _id: vid_id,
        type: 'series',
    }, {
        title: title ? title : initData?.title,
        sub_title: sub_title ? sub_title : initData?.sub_title,
        pg: pg ? pg : initData?.pg,
        vid_class: vid_class ? vid_class : initData?.vid_class,
        category: category ? category : initData?.category,
        genre: genre ? genre : initData?.genre,
        cast: cast ? cast : initData?.cast,
        episodes: episodes ? episodes : initData?.episodes,
        released_date: released_date ? released_date : initData?.released_date,
        expiry_date: expiry_date ? expiry_date : initData?.expiry_date,
        runtime: runtime ? runtime : initData?.runtime,
        default_rating: default_rating ? default_rating : initData?.default_rating,
    }, {
        new: true,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'Series Updated successfully',
    });
});
// !this doesnt do anything
AdminUploadController.deleteSeries = catchAsync_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    //TODO delete S3 objecttsss
    (0, responder_1.sendResponse)({
        res,
        message: 'TODO',
    });
    // await VideoModel.findOneAndDelete({_id: vid_id})
});
AdminUploadController.fetchSeries = catchAsync_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 10);
    const videos = await videos_model_1.VideoModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: ['$type', 'series'],
                },
            },
        },
        {
            $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
            },
        },
        {
            $sort: {
                updatedAt: 1,
            },
        },
        {
            $skip: (page - 1) * limit || 0,
        },
        {
            $limit: limit,
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: videos,
        message: 'Series fetched successfully',
    });
});
