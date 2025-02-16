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
    (0, responder_1.sendResponse)({
        res,
        data: await UpcomingService_1.UpcomingService.customerFetch(query, GetDefined_1.GetDefined.loggedInUser(user)),
    });
});
CustomerUpcomingController.subscription = (type) => Catch_1.Catch.async(async ({ user, params: { id } }, res) => {
    await UpcomingService_1.UpcomingService.customerSubscription(GetDefined_1.GetDefined.loggedInUser(user), id, type);
    (0, responder_1.sendResponse)({
        res,
        message: 'subscription updated successfully',
    });
});
CustomerUpcomingController.isSubscribed = Catch_1.Catch.async(async ({ user, params: { id } }, res) => {
    const user_subscribed = await UpcomingService_1.UpcomingService.customerIsSubscribed(GetDefined_1.GetDefined.loggedInUser(user), id);
    (0, responder_1.sendResponse)({
        res,
        data: { user_subscribed },
        message: 'User subsciption status',
    });
});
