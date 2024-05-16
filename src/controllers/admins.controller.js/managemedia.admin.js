const { uploadLargeVideos } = require("../../utils/media-management");
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

        const { fileName, fileHandle } = req.body;

        const video = await uploadLargeVideos(req, fileHandle, fileName, res);
        console.log(video);
        // return successResponse(res, 200, video, "video uploaded");
    } catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
