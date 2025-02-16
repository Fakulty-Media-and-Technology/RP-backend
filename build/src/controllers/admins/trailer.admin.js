"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminTrailerController = void 0;
const Catch_1 = require("../../utils/Catch");
const OperationalError_1 = require("../../utils/OperationalError");
const trailer_model_1 = require("../../models/trailer.model");
const responder_1 = require("../../utils/responder");
class AdminTrailerController {
}
exports.AdminTrailerController = AdminTrailerController;
_a = AdminTrailerController;
AdminTrailerController.createTrailer = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await trailer_model_1.TrailerModel.create(req.body),
        message: 'trailer created',
    });
});
AdminTrailerController.updateTrailer = Catch_1.Catch.async(async (req, res) => {
    const trailer = await trailer_model_1.TrailerModel.findByIdAndUpdate(req.params.trailerId, req.body, {
        new: true,
    });
    if (trailer === null) {
        throw new OperationalError_1.OperationalError('invalid trailer Id', 404);
    }
    (0, responder_1.sendResponse)({
        res,
        data: trailer,
        message: 'trailer updated',
    });
});
