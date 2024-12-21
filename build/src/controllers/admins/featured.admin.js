"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFeaturedController = void 0;
const FeaturedService_1 = require("../../services/core/FeaturedService");
const Catch_1 = require("../../utils/Catch");
const OperationalError_1 = require("../../utils/OperationalError");
const responder_1 = require("../../utils/responder");
class AdminFeaturedController {
}
exports.AdminFeaturedController = AdminFeaturedController;
_a = AdminFeaturedController;
AdminFeaturedController.searchContents = Catch_1.Catch.async(async ({ query: { text } }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'contents fetched successful',
        data: await FeaturedService_1.FeaturedService.searchVideosByText(text),
    });
});
AdminFeaturedController.addFeatured = Catch_1.Catch.async(async ({ body: { type, id, expiry } }, res) => {
    // TODO: Use Joi or Yup
    if (!['vod', 'event'].includes(type)) {
        throw new OperationalError_1.OperationalError("type of content must be specified 'vod or event'", 400);
    }
    if (!type || !id || !expiry) {
        throw new OperationalError_1.OperationalError('all inputs are required', 400);
    }
    await FeaturedService_1.FeaturedService.addFeatured({ id, type, expiry });
    (0, responder_1.sendResponse)({
        res,
        message: 'Featured Added',
    });
});
AdminFeaturedController.getFeaturedContents = Catch_1.Catch.async(async (_, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await FeaturedService_1.FeaturedService.getFeaturedContents(),
        message: 'contents fetched successful',
    });
});
