"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSettingsController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
const CustomerSettingsService_1 = require("../../services/core/CustomerSettingsService");
class CustomerSettingsController {
}
exports.CustomerSettingsController = CustomerSettingsController;
_a = CustomerSettingsController;
CustomerSettingsController.notificationSettings = catchAsync_1.Catch.async(async ({ user, body }, res) => {
    await CustomerSettingsService_1.CustomerSettingsService.setNotificationSettings(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'notification settings edited',
    });
});
CustomerSettingsController.addToWatchList = catchAsync_1.Catch.async(async ({ user, body: { vid_id } }, res) => {
    await CustomerSettingsService_1.CustomerSettingsService.pushPullFromWatchlist(GetDefined_1.GetDefined.loggedInUser(user), vid_id, 'push');
    (0, responder_1.sendResponse)({
        res,
        message: 'video added to watchlist',
    });
});
CustomerSettingsController.remFromWatchList = catchAsync_1.Catch.async(async ({ user, body: { vid_id } }, res) => {
    await CustomerSettingsService_1.CustomerSettingsService.pushPullFromWatchlist(GetDefined_1.GetDefined.loggedInUser(user), vid_id, 'pull');
    (0, responder_1.sendResponse)({
        res,
        message: 'video removed from watchlist',
    });
});
CustomerSettingsController.addToInterest = catchAsync_1.Catch.async(async ({ user, body: { interest } }, res) => {
    await CustomerSettingsService_1.CustomerSettingsService.pushInterest(GetDefined_1.GetDefined.loggedInUser(user), interest);
    (0, responder_1.sendResponse)({
        res,
        message: 'interest added to list',
    });
});
