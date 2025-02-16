"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientVoteController = void 0;
const VoteService_1 = require("../../services/core/VoteService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class ClientVoteController {
}
exports.ClientVoteController = ClientVoteController;
_a = ClientVoteController;
ClientVoteController.createVoteInfo = Catch_1.Catch.async(async ({ user, body }, res) => {
    await VoteService_1.VoteService.createVoteInfo(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'vote-info instance created',
    });
});
ClientVoteController.updateVoteInfo = Catch_1.Catch.async(async ({ user, body }, res) => {
    await VoteService_1.VoteService.updateVoteInfo(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'vote-info updated',
    });
});
ClientVoteController.addVoteContestant = Catch_1.Catch.async(async ({ user, body }, res) => {
    await VoteService_1.VoteService.addVoteContestant(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'vote contestant added',
    });
});
ClientVoteController.votestatusInfo = Catch_1.Catch.async(async ({ user, query: { live_id } }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'voting progress info',
        data: await VoteService_1.VoteService.voteStatusInfo(GetDefined_1.GetDefined.loggedInUser(user), live_id),
    });
});
ClientVoteController.rmVoteContestants = Catch_1.Catch.async(async ({ user, query }, res) => {
    await VoteService_1.VoteService.removeVoteContestant(GetDefined_1.GetDefined.loggedInUser(user), {
        contestantId: query.contestant_id,
        liveId: query.live_id,
    });
    (0, responder_1.sendResponse)({
        res,
        statusCode: 204,
    });
});
ClientVoteController.fetchVoteContestants = Catch_1.Catch.async(async ({ user, query: { live_id } }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'vote contestants',
        data: await VoteService_1.VoteService.fetchVoteContestants(GetDefined_1.GetDefined.loggedInUser(user), live_id),
    });
});
