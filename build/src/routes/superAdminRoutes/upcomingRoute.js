"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminUpcomingRouter = void 0;
const express_1 = require("express");
const upcoming_admin_1 = require("../../controllers/admins/upcoming.admin");
const requestValidator_1 = require("../../middlewares/requestValidator");
const admin_1 = require("../../validations/admin");
exports.superAdminUpcomingRouter = (0, express_1.Router)();
exports.superAdminUpcomingRouter.get('/event/getall', (0, requestValidator_1.requestValidator)(admin_1.upcomingAllGetSchema), upcoming_admin_1.AdminUpcomingController.upcomingsAllGet);
