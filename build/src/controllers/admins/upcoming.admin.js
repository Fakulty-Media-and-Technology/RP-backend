"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUpcomingController = void 0;
const UpcomingService_1 = require("../../services/core/UpcomingService");
const Catch_1 = require("../../utils/Catch");
const OperationalError_1 = require("../../utils/OperationalError");
const requestValidator_1 = require("../../middlewares/requestValidator");
const responder_1 = require("../../utils/responder");
const admin_1 = require("../../validations/admin");
const UploadMediaUtils_1 = require("../../utils/UploadMediaUtils");
class AdminUpcomingController extends UploadMediaUtils_1.UploadMediaUtils {
}
exports.AdminUpcomingController = AdminUpcomingController;
_a = AdminUpcomingController;
AdminUpcomingController.createUpcomingEvent = Catch_1.Catch.async(async ({ body, files: reqFiles }, res) => {
    const { data: _data } = body;
    if (_data == null || typeof _data !== 'string') {
        throw new OperationalError_1.OperationalError('formData.data is required and must be a JSON serialized string', 400);
    }
    const files = _a._checkFiles(reqFiles);
    if (Object.keys(files).length === 0) {
        throw new OperationalError_1.OperationalError('Expected at least one file', 400);
    }
    const data = {
        ...JSON.parse(body.data),
        portraitPhoto: files.portraitPhoto?.[0],
        landscapePhoto: files.landscapePhoto?.[0],
        trailer: files.trailer?.[0],
    };
    (0, requestValidator_1.validate)(admin_1.createUpcomingEventSchema, data);
    (0, responder_1.sendResponse)({
        res,
        data: await UpcomingService_1.UpcomingService.adminCreate(data),
        message: 'upcoming event created',
    });
});
AdminUpcomingController.upcomingsAllGet = Catch_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await UpcomingService_1.UpcomingService.adminFetch(query),
        message: 'all upcomings fetched',
    });
});
