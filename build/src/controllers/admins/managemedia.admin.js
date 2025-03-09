"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminManageSharedController = void 0;
const Catch_1 = require("../../utils/Catch");
const responder_1 = require("../../utils/responder");
const AdminManagemediaService_1 = require("../../services/core/AdminManagemediaService");
const shared_controller_1 = require("../common/shared.controller");
const requestValidator_1 = require("../../middlewares/requestValidator");
const admin_1 = require("../../validations/admin");
class AdminManageSharedController extends shared_controller_1.SharedController {
}
exports.AdminManageSharedController = AdminManageSharedController;
_a = AdminManageSharedController;
AdminManageSharedController.searchClient = Catch_1.Catch.async(async (req, res) => {
    const clients = await AdminManagemediaService_1.AdminManageMediaService.searchClient(req.query.search, req.query);
    (0, responder_1.sendResponse)({
        res,
        data: clients,
        message: 'matched clients fetched',
    });
});
AdminManageSharedController.getLivesByType = Catch_1.Catch.async(async ({ query, params: { type } }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdminManagemediaService_1.AdminManageMediaService.getLivesByType(type, query),
    });
});
//TODO delete and edit channel
AdminManageSharedController.addSubtitle = Catch_1.Catch.async(async (req, res) => {
    req.body.subtitle = req.file;
    (0, requestValidator_1.validate)(admin_1.addSubtitleSchema, req.body);
    (0, responder_1.sendResponse)({
        res,
        message: 'subtitle added successfully',
        data: await AdminManagemediaService_1.AdminManageMediaService.addSubtitle(req.body),
    });
});
