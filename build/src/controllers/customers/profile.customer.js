"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerProfileController = void 0;
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
const CustomerProfileService_1 = require("../../services/core/CustomerProfileService");
class CustomerProfileController {
}
exports.CustomerProfileController = CustomerProfileController;
_a = CustomerProfileController;
CustomerProfileController.customerProfileFetch = Catch_1.Catch.async(async ({ user }, res) => {
    const currentUser = GetDefined_1.GetDefined.loggedInUser(user);
    const result = await CustomerProfileService_1.CustomerProfileService.fetchCustomerProfile({
        currentUser,
        currentUserRoleHybrid: currentUser.role,
    });
    (0, responder_1.sendResponse)({
        res,
        data: result.data,
        message: result.message,
    });
});
CustomerProfileController.createSuggestion = Catch_1.Catch.async(async ({ user, body }, res) => {
    await CustomerProfileService_1.CustomerProfileService.createSuggestion(GetDefined_1.GetDefined.loggedInUser(user), body.message);
    (0, responder_1.sendResponse)({
        res,
        message: 'suggestion created and submitted to the admin',
    });
});
CustomerProfileController.editProfile = Catch_1.Catch.async(async ({ user, body }, res) => {
    await CustomerProfileService_1.CustomerProfileService.editProfile(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'Profile and payment details updated',
    });
});
