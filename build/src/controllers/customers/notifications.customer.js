"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerNotificationController = void 0;
const NotificationService_1 = require("../../services/core/NotificationService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
class CustomerNotificationController {
}
exports.CustomerNotificationController = CustomerNotificationController;
_a = CustomerNotificationController;
CustomerNotificationController.getNotifications = Catch_1.Catch.async(async ({ user, query }, res) => {
    const data = await NotificationService_1.NotificationService.getNotifications({
        currentUser: GetDefined_1.GetDefined.loggedInUser(user),
        page: (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1),
        limit: (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 20),
    });
    (0, responder_1.sendResponse)({
        res,
        data,
        message: 'Notifications fetched successfully',
    });
});
CustomerNotificationController.handleNotificationClick = Catch_1.Catch.async(async ({ user, params: { notification_id } }, res) => {
    await NotificationService_1.NotificationService.markUserNotificationSeen(GetDefined_1.GetDefined.loggedInUser(user), notification_id);
    (0, responder_1.sendResponse)({
        res,
        message: 'Notification marked as seen',
        data: { notification_id },
    });
});
