"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminLivesRouter = void 0;
const express_1 = require("express");
const managemedia_admin_1 = require("../../controllers/admins/managemedia.admin");
exports.superAdminLivesRouter = (0, express_1.Router)();
exports.superAdminLivesRouter.get('/search-clients', managemedia_admin_1.AdminManageSharedController.searchClient);
exports.superAdminLivesRouter.get('/all/:type', managemedia_admin_1.AdminManageSharedController.getLivesByType);
