"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersController = void 0;
const AdminUsersService_1 = require("../../services/core/AdminUsersService");
const Catch_1 = require("../../utils/Catch");
const responder_1 = require("../../utils/responder");
class AdminUsersController {
}
exports.AdminUsersController = AdminUsersController;
_a = AdminUsersController;
AdminUsersController.adminFetchUsers = Catch_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdminUsersService_1.AdminUsersService.fetchAll(query),
        message: 'Users detials fetched',
    });
});
AdminUsersController.adminFetchSingleUser = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdminUsersService_1.AdminUsersService.fetchOne(req.params.userId),
        message: 'user fetched successfully',
    });
});
AdminUsersController.adminDeleteUser = Catch_1.Catch.async(async (req, res) => {
    await AdminUsersService_1.AdminUsersService.deleteOne(req.params.userId);
    (0, responder_1.sendResponse)({
        res,
        message: 'user deleted successfully',
    });
});
