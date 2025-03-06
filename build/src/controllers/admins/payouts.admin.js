"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPayoutController = void 0;
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
const AdminPayoutServie_1 = require("../../services/core/AdminPayoutServie");
class AdminPayoutController {
}
exports.AdminPayoutController = AdminPayoutController;
_a = AdminPayoutController;
AdminPayoutController.payoutReqAll = Catch_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdminPayoutServie_1.AdminPayoutService.payOutRequests(query),
    });
});
AdminPayoutController.payoutReqOne = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdminPayoutServie_1.AdminPayoutService.payoutById(req.params.id),
        message: 'payouts fetched',
    });
});
AdminPayoutController.payoutReqGroup = Catch_1.Catch.async(async (_, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdminPayoutServie_1.AdminPayoutService.payoutGroups(),
        message: 'payout requests grouped',
    });
});
AdminPayoutController.payoutStatusUpdate = Catch_1.Catch.async(async (req, res) => {
    await AdminPayoutServie_1.AdminPayoutService.updatePayoutStatus({
        payId: req.params.id,
        adminId: GetDefined_1.GetDefined.loggedInUser(req.user).id,
        payStatus: req.body.status,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'payout status updated',
    });
});
