"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUpcomingController = void 0;
const trailer_model_1 = require("../../models/trailer.model");
const upcoming_model_1 = require("../../models/upcoming.model");
const catchAsync_1 = require("../../utils/catchAsync");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
class AdminUpcomingController {
}
exports.AdminUpcomingController = AdminUpcomingController;
_a = AdminUpcomingController;
AdminUpcomingController.createUpcomingEvent = catchAsync_1.Catch.async(async (req, res) => {
    const { title, type, details, release_date, portrait_photo, landscape_photo, trailer_id } = req.body;
    if (!title || !type || !details || !release_date || !portrait_photo || !landscape_photo) {
        throw new OperationalError_1.OperationalError('all details are required', 400);
    }
    const checkTrailer = await trailer_model_1.TrailerModel.findOne({ _id: trailer_id });
    if (!checkTrailer) {
        throw new OperationalError_1.OperationalError('invalid trailer_id supplied', 400);
    }
    const upcomingEvent = new upcoming_model_1.UpcomingModel({
        title: title,
        type: type,
        details: details,
        release_date: new Date(release_date),
        portrait_photo: portrait_photo,
        landscape_photo: landscape_photo,
        trailer_id: trailer_id,
    });
    await upcomingEvent.save();
    (0, responder_1.sendResponse)({
        res,
        data: upcomingEvent,
        message: 'invalid trailer_id supplied',
    });
});
AdminUpcomingController.upcomingsAllGet = catchAsync_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const allDat = await upcoming_model_1.UpcomingModel.aggregate([
        {
            $match: {},
        },
        {
            $project: {
                __v: 0,
                createdAt: 0,
                updatedAt: 0,
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
        data: allDat,
        message: 'all upcomings fetched',
    });
});
