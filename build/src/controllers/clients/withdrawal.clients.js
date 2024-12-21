"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientWithdrawalController = void 0;
const WithdrawalService_1 = require("../../services/core/WithdrawalService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class ClientWithdrawalController {
}
exports.ClientWithdrawalController = ClientWithdrawalController;
_a = ClientWithdrawalController;
ClientWithdrawalController.reqPayout = Catch_1.Catch.async(async (req, res) => {
    await WithdrawalService_1.WithdrawalService.requestPayout(GetDefined_1.GetDefined.loggedInUser(req.user), req.body);
    (0, responder_1.sendResponse)({
        res,
        message: 'payout request submitted',
    });
});
ClientWithdrawalController.reqPayoutEdit = Catch_1.Catch.async(async ({ user, params, body }, res) => {
    await WithdrawalService_1.WithdrawalService.editPayout(GetDefined_1.GetDefined.loggedInUser(user), params.id, body);
    (0, responder_1.sendResponse)({
        res,
        message: 'Payout edited',
    });
});
ClientWithdrawalController.payoutReqInfoAll = Catch_1.Catch.async(async ({ user }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'payout requests all history',
        data: await WithdrawalService_1.WithdrawalService.requestAllPayoutInfo(GetDefined_1.GetDefined.loggedInUser(user)),
    });
});
ClientWithdrawalController.payoutReqInfoGroup = Catch_1.Catch.async(async ({ user }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'payout requests all grouped',
        data: await WithdrawalService_1.WithdrawalService.requestPayoutInfoGroups(GetDefined_1.GetDefined.loggedInUser(user)),
    });
});
