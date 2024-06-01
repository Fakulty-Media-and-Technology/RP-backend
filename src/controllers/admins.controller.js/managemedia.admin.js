const { readPhotos } = require("../../utils/media-access");
const {
    uploadLargeVideos,
    uploadShortVideos,
    uploadImage,
} = require("../../utils/media-management");
const {
    serverError,
    successResponse,
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
