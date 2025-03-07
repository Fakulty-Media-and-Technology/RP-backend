"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUpcomingController = void 0;
const UpcomingService_1 = require("../../services/core/UpcomingService");
const Catch_1 = require("../../utils/Catch");
const responder_1 = require("../../utils/responder");
class AdminUpcomingController {
}
exports.AdminUpcomingController = AdminUpcomingController;
_a = AdminUpcomingController;
AdminUpcomingController.upcomingsAllGet = Catch_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await UpcomingService_1.UpcomingService.adminFetch({
            contentType: query.contentType,
            page: query.page,
            limit: query.limit,
        }),
        message: 'upcomings fetched',
    });
});
