"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUploadController = void 0;
const poster_model_1 = require("../../models/poster.model");
const videos_model_1 = require("../../models/videos.model");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
const mongoDbSessionRunner_1 = require("../../utils/mongoDbSessionRunner");
class AdminUploadController {
}
exports.AdminUploadController = AdminUploadController;
_a = AdminUploadController;
AdminUploadController._validateInput = (type, data) => {
    const { title, sub_title, bucket, key, pg, vid_class, category, genre, cast, released_date, expiry_date, runtime, default_rating, poster1_data, poster2_data, artist_name, episodes, } = data;
    if (!title ||
        !key ||
        !pg ||
        !vid_class ||
        !category ||
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
    switch (type) {
        case 'series':
            if (typeof episodes === undefined ||
                typeof genre === undefined ||
                typeof cast === undefined) {
                throw new OperationalError_1.OperationalError('episodes, cast and genres are required when uploading series', 400);
            }
            break;
        case 'music video':
            if (typeof artist_name === undefined || typeof bucket === undefined) {
                throw new OperationalError_1.OperationalError('artist_name and bucket are required when uploading series', 400);
            }
            break;
        default:
            if (typeof genre === undefined ||
                typeof cast === undefined ||
                typeof bucket === undefined) {
                throw new OperationalError_1.OperationalError('cast and genre and bucket are required when uploading movies or skits', 400);
            }
            break;
    }
};
AdminUploadController._makePosters = async (data, session) => {
    await new poster_model_1.PosterImageModel({
        video_id: data.videoId,
        bucket: data.posterOne.bucket,
        key: data.posterOne.key,
        dimension: data.posterOne.dimension,
    }).save({ session });
    await new poster_model_1.PosterImageModel({
        video_id: data.videoId,
        bucket: data.posterTwo.bucket,
        key: data.posterTwo.key,
        dimension: data.posterTwo.dimension,
    }).save({ session });
};
AdminUploadController._addVideoWithSession = async (input, session) => {
    _a._validateInput(input.type, input.data);
    const { poster1_data, poster2_data } = input.data;
    const videoData = await new videos_model_1.VideoModel({
        admin_id: input.adminId,
        type: input.type,
        ...input.data,
        is_series: input.type === 'series',
    }).save({ session });
    const makePostersParams = {
        videoId: videoData.id,
        posterOne: {
            bucket: poster1_data.bucket,
            key: poster1_data.key,
            dimension: poster1_data.dimension,
        },
        posterTwo: {
            bucket: poster2_data.bucket,
            key: poster2_data.key,
            dimension: poster2_data.dimension,
        },
    };
    await _a._makePosters(makePostersParams, session);
};
AdminUploadController.addVideoByType = (type) => Catch_1.Catch.async(async (req, res) => {
    const admin = GetDefined_1.GetDefined.loggedInUser(req.user);
    await (0, mongoDbSessionRunner_1.withMongoDBSession)(_a._addVideoWithSession, {
        type,
        data: req.body,
        adminId: admin.id,
    });
    (0, responder_1.sendResponse)({
        res,
        message: `${type} added successfully`,
    });
});
AdminUploadController.editVideoByType = (type) => Catch_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    const initData = await videos_model_1.VideoModel.findOne({ _id: vid_id, type });
    if (initData == null) {
        throw new OperationalError_1.OperationalError('video does not exist or does not exist as this type', 400);
    }
    const requestData = req.body;
    const initDataObject = initData.toObject();
    const update = {};
    Object.entries(initDataObject).forEach(([key, value]) => {
        if (key === '_id')
            return;
        const requestDataValue = requestData[key];
        update[key] = typeof requestDataValue !== undefined ? requestDataValue : value;
    });
    const updatedVid = await videos_model_1.VideoModel.findOneAndUpdate({
        _id: vid_id,
        type,
    }, update, {
        new: true,
    });
    (0, responder_1.sendResponse)({
        res,
        data: updatedVid,
        message: `${type} edited successfully`,
    });
});
AdminUploadController.fetchVideosByType = (type) => Catch_1.Catch.async(async ({ query }, res) => {
    const dbQuery = videos_model_1.VideoModel.find({ type })
        .select('-__v -createdAt -updatedAt')
        .sort({ updatedAt: 1 });
    const features = new QueryParamsFeatures_1.QueryParamsFeatures(dbQuery, {
        defaultLimit: 10,
        defaultPage: 1,
        queryParams: query,
    });
    const videos = await features.paginate().query;
    (0, responder_1.sendResponse)({
        res,
        message: `${type}s fetched successfully`,
        data: videos,
    });
});
AdminUploadController.deleteVideoByType = (_) => Catch_1.Catch.async(async (req, res) => {
    const vid_id = req.params.id;
    // const deletedVid = await VideoModel.findOneAndDelete({ _id: vid_id, type })
    // if (deletedVid == null) {
    //   throw new OperationalError('Not found', 404)
    // }
    (0, responder_1.sendResponse)({
        res,
        message: 'TODO',
    });
    //TODO delete S3 objecttsss
});
