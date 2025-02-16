"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientLiveStreamController = void 0;
const LiveStreamService_1 = require("../../services/core/LiveStreamService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class ClientLiveStreamController {
}
exports.ClientLiveStreamController = ClientLiveStreamController;
_a = ClientLiveStreamController;
ClientLiveStreamController.getLiveStreamCredentials = Catch_1.Catch.async(async ({ user }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'clients stream instances',
        data: await LiveStreamService_1.LiveStreamService.getLiveStreamCredentials(GetDefined_1.GetDefined.loggedInUser(user)),
    });
});
ClientLiveStreamController.extendLiveEvent = Catch_1.Catch.async(async ({ user, body }, res) => {
    await LiveStreamService_1.LiveStreamService.extendLiveEvent(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'Live event extended',
    });
});
ClientLiveStreamController.calculateEventCharges = Catch_1.Catch.sync((req, res) => {
    const { start, expiry } = req.query;
    (0, responder_1.sendResponse)({
        res,
        message: 'Cost for your event',
        data: LiveStreamService_1.LiveStreamService.calcEventCharges(start, expiry),
    });
});
