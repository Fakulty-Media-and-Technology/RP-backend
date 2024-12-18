"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientProfileController = void 0;
const ClientProfileService_1 = require("../../services/core/ClientProfileService");
const catchAsync_1 = require("../../utils/catchAsync");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class ClientProfileController {
}
exports.ClientProfileController = ClientProfileController;
_a = ClientProfileController;
ClientProfileController.clientEditProfile = catchAsync_1.Catch.async(async ({ user, body }, res) => {
    await ClientProfileService_1.ClientProfileService.editProfile(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'Profile Updated',
    });
});
ClientProfileController.clientsPaymentHis = catchAsync_1.Catch.async(async ({ user }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'client payment history fetched',
        data: await ClientProfileService_1.ClientProfileService.clientsPaymentHis(GetDefined_1.GetDefined.loggedInUser(user)),
    });
});
ClientProfileController.clientProfileFetch = catchAsync_1.Catch.async(async ({ user }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'client profile fetched',
        data: await ClientProfileService_1.ClientProfileService.fetchClientProfile(GetDefined_1.GetDefined.loggedInUser(user)),
    });
});
