"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDashboardController = void 0;
const DashboardService_1 = require("../../services/core/DashboardService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class AdminDashboardController {
}
exports.AdminDashboardController = AdminDashboardController;
_a = AdminDashboardController;
AdminDashboardController.fetchChannels = Catch_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        statusCode: 200,
        message: 'admin profile',
        data: await DashboardService_1.DashboardService.fetchChannels(query),
    });
});
AdminDashboardController.currentAdminProfile = Catch_1.Catch.async(async ({ user }, res) => {
    const currentUser = GetDefined_1.GetDefined.loggedInUser(user);
    const currentAdmin = await DashboardService_1.DashboardService.getCurrentAdminProfile(currentUser.id);
    (0, responder_1.sendResponse)({
        res,
        statusCode: 200,
        message: 'admin profile',
        data: currentAdmin,
    });
});
AdminDashboardController.editAdminProfile = Catch_1.Catch.async(async ({ user, body }, res) => {
    const currentUser = GetDefined_1.GetDefined.loggedInUser(user);
    const { first_name, last_name, country_code, mobile, photo, email, password } = body;
    await DashboardService_1.DashboardService.editAdminProfile(currentUser, {
        first_name,
        last_name,
        country_code,
        mobile,
        photo,
        email,
        password,
    });
    (0, responder_1.sendResponse)({
        res,
        statusCode: 200,
        message: 'admin profile',
        data: null,
    });
});
AdminDashboardController.fetchVideosByType = Catch_1.Catch.async(async ({ query }, res) => {
    const videos = await DashboardService_1.DashboardService.fetchVideosByType(query.type, query);
    (0, responder_1.sendResponse)({
        res,
        statusCode: 200,
        message: 'videos fetched by types',
        data: videos,
    });
});
AdminDashboardController.adminFetchChannel = Catch_1.Catch.async(async ({ query }, res) => {
    const channels = await DashboardService_1.DashboardService.fetchChannels(query);
    (0, responder_1.sendResponse)({
        res,
        statusCode: 200,
        message: 'videos fetched by types',
        data: channels,
    });
});
AdminDashboardController.fetchBalanceAndUsers = Catch_1.Catch.async(async (_, res) => {
    (0, responder_1.sendResponse)({
        res,
        statusCode: 200,
        message: 'Dashboard Balance and Users',
        data: await DashboardService_1.DashboardService.fetchBalanceAndUser(),
    });
});
AdminDashboardController.totalContentsAndChunks = Catch_1.Catch.async(async (_, res) => {
    (0, responder_1.sendResponse)({
        res,
        statusCode: 200,
        message: 'Dashboard Balance and Users',
        data: await DashboardService_1.DashboardService.totalContentsAndChunks(),
    });
});
