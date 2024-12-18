"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerVoteController = void 0;
const CustomerVoteService_1 = require("../../services/core/CustomerVoteService");
const catchAsync_1 = require("../../utils/catchAsync");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const responder_1 = require("../../utils/responder");
class CustomerVoteController {
}
exports.CustomerVoteController = CustomerVoteController;
_a = CustomerVoteController;
CustomerVoteController.fetchVoteInfo = catchAsync_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CustomerVoteService_1.CustomerVoteService.fetchVoteInfoByLiveId(query.live_id),
    });
});
CustomerVoteController.fetchVoteContestants = catchAsync_1.Catch.async(async ({ query: { live_id } }, res) => {
    if (typeof live_id !== 'string') {
        throw new OperationalError_1.OperationalError('required query.live_id must be a string', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        data: await CustomerVoteService_1.CustomerVoteService.fetchVoteContestantsByLiveId(live_id),
    });
});
CustomerVoteController.createVote = catchAsync_1.Catch.async(async ({ user, body }, res) => {
    await CustomerVoteService_1.CustomerVoteService.createVote(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'vote created',
    });
});
CustomerVoteController.donateFund = catchAsync_1.Catch.async(async ({ user, body }, res) => {
    await CustomerVoteService_1.CustomerVoteService.donateFund(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'fund donated',
    });
});
