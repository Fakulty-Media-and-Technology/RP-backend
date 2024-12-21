"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerUpcomingController = void 0;
const CustomerUpcomingService_1 = require("../../services/core/CustomerUpcomingService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class CustomerUpcomingController {
}
exports.CustomerUpcomingController = CustomerUpcomingController;
_a = CustomerUpcomingController;
CustomerUpcomingController.upComingFetch = Catch_1.Catch.async(async (_, res) => {
    // TODO: This should be paginated
    (0, responder_1.sendResponse)({
        res,
        data: await CustomerUpcomingService_1.CustomerUpcomingService.fetchUpcoming(),
    });
});
CustomerUpcomingController.upComingSubscribe = Catch_1.Catch.async(async ({ user, params: { id } }, res) => {
    await CustomerUpcomingService_1.CustomerUpcomingService.subscribeToUpComing(GetDefined_1.GetDefined.loggedInUser(user), id);
    (0, responder_1.sendResponse)({
        res,
        message: 'user subscribed to event',
    });
});
CustomerUpcomingController.upComingIsUserSubscribed = Catch_1.Catch.async(async ({ user, params: { id } }, res) => {
    const user_subscribed = await CustomerUpcomingService_1.CustomerUpcomingService.isSubscribedToUpcoming(GetDefined_1.GetDefined.loggedInUser(user), id);
    (0, responder_1.sendResponse)({
        res,
        data: { user_subscribed },
        message: 'User subsciption status',
    });
});
CustomerUpcomingController.upComingUnsubscribe = Catch_1.Catch.async(async ({ user, params: { id } }, res) => {
    await CustomerUpcomingService_1.CustomerUpcomingService.unsubscribeFromUpcoming(GetDefined_1.GetDefined.loggedInUser(user), id);
    (0, responder_1.sendResponse)({
        res,
        message: 'user unsubscribed',
    });
});
