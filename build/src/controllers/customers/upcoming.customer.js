"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerUpcomingController = void 0;
const UpcomingService_1 = require("../../services/core/UpcomingService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class CustomerUpcomingController {
}
exports.CustomerUpcomingController = CustomerUpcomingController;
_a = CustomerUpcomingController;
CustomerUpcomingController.fetch = Catch_1.Catch.async(async ({ query, user }, res) => {
    const upcoming = await UpcomingService_1.UpcomingService.customerFetch({
        contentType: query.contentType,
        currentUser: GetDefined_1.GetDefined.loggedInUser(user),
        page: query.page,
        limit: query.limit,
    });
    (0, responder_1.sendResponse)({
        res,
        data: upcoming,
    });
});
CustomerUpcomingController.subscription = (action) => Catch_1.Catch.async(async ({ user, params: { id, contentType } }, res) => {
    await UpcomingService_1.UpcomingService.customerSubscription({
        action,
        currentUser: GetDefined_1.GetDefined.loggedInUser(user),
        contentId: id,
        contentType: contentType,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'subscription updated successfully',
    });
});
CustomerUpcomingController.isSubscribed = Catch_1.Catch.async(async ({ user, params: { id, contentType } }, res) => {
    const user_subscribed = await UpcomingService_1.UpcomingService.customerIsSubscribed({
        contentId: id,
        contentType: contentType,
        currentUser: GetDefined_1.GetDefined.loggedInUser(user),
    });
    (0, responder_1.sendResponse)({
        res,
        data: { user_subscribed },
        message: 'User subsciption status',
    });
});
