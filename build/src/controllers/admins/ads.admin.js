"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAdsController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const responder_1 = require("../../utils/responder");
const AdmanagerService_1 = require("../../services/core/AdmanagerService");
class AdminAdsController {
}
exports.AdminAdsController = AdminAdsController;
_a = AdminAdsController;
AdminAdsController.addAds = catchAsync_1.Catch.async(async (req, res) => {
    const { title, sub_title, type, brand, photo, link, duration, start, expiry, active } = req.body;
    const ad = await AdmanagerService_1.AdManagerService.addAd({
        title,
        sub_title,
        type,
        brand,
        photo,
        link,
        duration,
        start,
        expiry,
        active,
    });
    (0, responder_1.sendResponse)({
        res,
        statusCode: 204,
        message: `${ad.title} added`,
        data: ad,
    });
});
AdminAdsController.getAds = catchAsync_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdmanagerService_1.AdManagerService.getAds(query),
        message: 'ads fetched',
    });
});
AdminAdsController.removeAds = catchAsync_1.Catch.async(async ({ params: { id: addId } }, res) => {
    await AdmanagerService_1.AdManagerService.deleteAd(addId);
    (0, responder_1.sendResponse)({
        res,
        message: 'ad deleted',
    });
});
