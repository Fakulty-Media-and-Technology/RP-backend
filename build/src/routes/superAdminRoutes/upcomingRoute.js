"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminUpcomingRouter = void 0;
const express_1 = require("express");
const upcoming_admin_1 = require("../../controllers/admins/upcoming.admin");
const Multer_1 = require("../../utils/Multer");
exports.superAdminUpcomingRouter = (0, express_1.Router)();
exports.superAdminUpcomingRouter.post('/event/create', Multer_1.Multer.createUpcomingConfig, upcoming_admin_1.AdminUpcomingController.createUpcomingEvent);
exports.superAdminUpcomingRouter.get('/event/getall', upcoming_admin_1.AdminUpcomingController.upcomingsAllGet);
