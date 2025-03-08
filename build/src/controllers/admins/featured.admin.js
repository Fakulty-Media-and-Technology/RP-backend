"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFeaturedController = void 0;
const FeaturedService_1 = require("../../services/core/FeaturedService");
const Catch_1 = require("../../utils/Catch");
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
    await FeaturedService_1.FeaturedService.addFeatured({ id, type, expiry });
    (0, responder_1.sendResponse)({
        res,
        message: 'Featured Added',
    });
});
AdminFeaturedController.getFeaturedContents = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await FeaturedService_1.FeaturedService.getFeaturedContents(req.query),
        message: 'contents fetched successful',
    });
});
