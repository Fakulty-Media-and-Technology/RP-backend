"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPushNotificationController = void 0;
const NotificationService_1 = require("../../services/core/NotificationService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class CustomerPushNotificationController {
}
exports.CustomerPushNotificationController = CustomerPushNotificationController;
_a = CustomerPushNotificationController;
CustomerPushNotificationController.registerDeviceToken = Catch_1.Catch.async(async ({ user, body }, res) => {
    await NotificationService_1.NotificationService.Push.setDeviceToken(GetDefined_1.GetDefined.loggedInUser(user).id, body);
    (0, responder_1.sendResponse)({
        res,
        message: 'FCM device token registered successfully',
    });
});
CustomerPushNotificationController.updateDeviceToken = Catch_1.Catch.async(async ({ user, body }, res) => {
    await NotificationService_1.NotificationService.Push.updateDeviceToken(GetDefined_1.GetDefined.loggedInUser(user).id, body);
    (0, responder_1.sendResponse)({
        res,
        message: 'FCM device token updated successfully',
    });
});
