"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPlanSubController = void 0;
const AdminPlanService_1 = require("../../services/core/AdminPlanService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class AdminPlanSubController {
}
exports.AdminPlanSubController = AdminPlanSubController;
_a = AdminPlanSubController;
AdminPlanSubController.createPlan = Catch_1.Catch.async(async (req, res) => {
    await AdminPlanService_1.AdminPlanSubService.createPlan(GetDefined_1.GetDefined.loggedInUser(req.user), req.body);
    (0, responder_1.sendResponse)({
        res,
        message: 'plan created',
    });
});
AdminPlanSubController.updatePlan = Catch_1.Catch.async(async (req, res) => {
    await AdminPlanService_1.AdminPlanSubService.updatePlan(req.params.id, req.body);
    (0, responder_1.sendResponse)({
        res,
        message: 'plan updated',
    });
});
AdminPlanSubController.fetchPlans = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdminPlanService_1.AdminPlanSubService.fetchPlans(req.query),
        message: 'plan fetched',
    });
});
AdminPlanSubController.fetchSubscriptions = Catch_1.Catch.async(async ({ query }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await AdminPlanService_1.AdminPlanSubService.fetchSubs(query),
        message: 'plan subs fetched',
    });
});
AdminPlanSubController.deletePlans = Catch_1.Catch.async(async (req, res) => {
    await AdminPlanService_1.AdminPlanSubService.deletePlan(req.params.id);
    (0, responder_1.sendResponse)({
        res,
        message: 'plan deleted successfully',
    });
});
