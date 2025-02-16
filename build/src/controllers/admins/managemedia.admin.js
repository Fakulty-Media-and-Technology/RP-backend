"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminManagemediaController = void 0;
const Catch_1 = require("../../utils/Catch");
const responder_1 = require("../../utils/responder");
const AdminManagemediaService_1 = require("../../services/core/AdminManagemediaService");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const media_controller_1 = require("../common/media.controller");
const requestValidator_1 = require("../../middlewares/requestValidator");
const admin_1 = require("../../validations/admin");
class AdminManagemediaController extends media_controller_1.MediaController {
}
exports.AdminManagemediaController = AdminManagemediaController;
_a = AdminManagemediaController;
AdminManagemediaController.createLive = ({ isAdmin }) => Catch_1.Catch.async(async (req, res) => {
    if (isAdmin && typeof req.body.client_id !== 'string') {
        throw new OperationalError_1.OperationalError('/body.client_id is required/', 400);
    }
    if (!isAdmin) {
        req.body.client_id = GetDefined_1.GetDefined.loggedInUser(req.user).id;
    }
    (0, responder_1.sendResponse)({
        res,
        data: await AdminManagemediaService_1.AdminManageMediaService.createLive(req.body),
        message: 'live stream event scheduled, credentials are on attached user dashboard',
    });
});
AdminManagemediaController.searchClient = Catch_1.Catch.async(async (req, res) => {
    const clients = await AdminManagemediaService_1.AdminManageMediaService.searchClient(req.query.search, req.query);
    (0, responder_1.sendResponse)({
        res,
        data: clients,
        message: 'matched clients fetched',
    });
});
AdminManagemediaController.getLivesByType = (type) => Catch_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdminManagemediaService_1.AdminManageMediaService.getLivesByType(type, query),
    });
});
//TODO delete and edit channel
AdminManagemediaController.addSubtitle = Catch_1.Catch.async(async (req, res) => {
    req.body.subtitle = req.file;
    (0, requestValidator_1.validate)(admin_1.addSubtitleSchema, req.body);
    (0, responder_1.sendResponse)({
        res,
        message: 'subtitle added successfully',
        data: await AdminManagemediaService_1.AdminManageMediaService.addSubtitle(req.body),
    });
});
