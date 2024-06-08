const PosterModel = require("../../models/poster.model");
const SubtitleModel = require("../../models/subtitle.model");
const TrailerModel = require("../../models/trailer.model");
const VideosModel = require("../../models/videos.model");
const { readPhotos } = require("../../services/media-access");
const {
    uploadLargeVideos,
    uploadShortVideos,
    uploadImage,
} = require("../../services/media-management");
const {
    serverError,
    successResponse,
    invalidRequest,
    failedResponse,
} = require("../../utils/response.handler");

exports.uploadLargeVideoRoute = async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
        const user = req.user;

        const { fileName, fileHandle, expire } = req.body;

        const video = await uploadLargeVideos(
            req,
            fileHandle,
            fileName,
            expire,
            res
        );
        console.log(video);
        // return successResponse(res, 200, video, "video uploaded");
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

//can be used for any video less than 5mb
exports.uploadShortVideoRoute = async (req, res) => {
    try {
        const user = req.user;

        const { fileName, fileHandle, expire } = req.body;

        const video = await uploadShortVideos(
            req,
            fileHandle,
            expire,
            fileName
        );

        return successResponse(res, 200, video, "short video uploaded");
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

exports.uploadImageRoute = async (req, res) => {
    try {
        const user = req.user;

        const { fileName, fileHandle } = req.body;

        const image = await uploadImage(req, fileHandle, fileName);

        return successResponse(res, 200, image, "image uploaded");
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

exports.adminGetPhotoUrl = async (req, res) => {
    try {
        const user = req.user;

        const { bucket, key } = req.body;

        const image = await readPhotos(bucket, key);

        return successResponse(res, 200, image, "image fetched");
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};

//Videos CRUD for both vod and live
exports.createVideo = async (req, res) => {
    try {
        const user = req.user;
        const {
            title,
            type,
            key,
            description,
            vid_class,
            pg,
            genre,
            category,
            released_date,
            expiry_date,
            subtitle_data,
            trailer_data,
            poster1_data,
            poster2_data,
        } = req.body;

        const vidDb = await new VideosModel({ admin_id: user._id }).save();

        if (!subtitle_data.key || !subtitle_data.language) {
            return invalidRequest(
                res,
                400,
                null,
                "subtitle file(key) and langauge is required"
            );
        }

        await new SubtitleModel({
            video_id: vidDb._id,
            key: subtitle_data.key,
            language: subtitle_data.language,
        }).save();

        if (!trailer_data.key) {
            return invalidRequest(
                res,
                400,
                null,
                "trailer file(key) is required"
            );
        }

        await new TrailerModel({
            video_id: vidDb._id,
            key: trailer_data.key,
        }).save();

        if (!poster1_data.key || !poster1_data.dimension) {
            return invalidRequest(
                res,
                400,
                null,
                "poster file(key) and orientation is required"
            );
        }

        await new PosterModel({
            video_id: vidDb._id,
            key: poster1_data.key,
            dimension: poster1_data.dimension,
        }).save();

        if (!poster2_data.key || !poster2_data.dimension) {
            return invalidRequest(
                res,
                400,
                null,
                "poster file(key) and orientation is required"
            );
        }

        await new PosterModel({
            video_id: vidDb._id,
            key: poster2_data.key,
            dimension: poster2_data.dimension,
        }).save();

        const titleExist = await VideosModel.findOne({ title: title });

        if (titleExist) {
            return failedResponse(
                req,
                400,
                title,
                "video woth thos title alrealdy exist!"
            );
        }

        if (
            !tittl ||
            !type ||
            !key ||
            !description ||
            !vid_class ||
            !pg ||
            !genre ||
            !category
        ) {
            return invalidRequest(
                res,
                400,
                null,
                "you have not filled all the required fields"
            );
        }

        await VideosModel.updateOne(
            { _id: vidDb._id },
            {
                title,
                type,
                key,
                description,
                class: vid_class,
                pg,
                genre,
                category,
                released_date: new Date(released_date),
                expiry_date: new Date(expiry_date),
            }
        );

        successResponse(
            req,
            200,
            null,
            "video and its meta-data added successfully"
        );
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
