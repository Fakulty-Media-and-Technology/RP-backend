"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminTrailerController = void 0;
const trailer_model_1 = require("../../models/trailer.model");
const catchAsync_1 = require("../../utils/catchAsync");
const responder_1 = require("../../utils/responder");
class AdminTrailerController {
}
exports.AdminTrailerController = AdminTrailerController;
_a = AdminTrailerController;
AdminTrailerController.createTrailer = catchAsync_1.Catch.async(async (req, res) => {
    const { bucket, key, video_id, video_title, details } = req.body;
    const addTrailer = new trailer_model_1.TrailerModel({
        video_id: video_id,
        video_title: video_title,
        details: details,
        bucket: bucket,
        key: key,
    });
    await addTrailer.save();
    (0, responder_1.sendResponse)({
        res,
        message: 'trailer ended',
    });
});
