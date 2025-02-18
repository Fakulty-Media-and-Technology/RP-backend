"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminEnumsRouter = void 0;
const express_1 = require("express");
const enums_admin_1 = require("../../controllers/admins/enums.admin");
const requestValidator_1 = require("../../middlewares/requestValidator");
const admin_1 = require("../../validations/admin");
exports.superAdminEnumsRouter = (0, express_1.Router)();
// ** genre
exports.superAdminEnumsRouter.post('/add-genre', (0, requestValidator_1.requestValidator)(admin_1.addGenreSchema), enums_admin_1.AdminEnumController.addGenre);
exports.superAdminEnumsRouter.get('/get-genres', enums_admin_1.AdminEnumController.getGenres);
exports.superAdminEnumsRouter.delete('/rem-genre/:id', enums_admin_1.AdminEnumController.remGenre);
// *** category
exports.superAdminEnumsRouter.post('/add-category', (0, requestValidator_1.requestValidator)(admin_1.addCategorySchema), enums_admin_1.AdminEnumController.addCategory);
exports.superAdminEnumsRouter.get('/get-categories', enums_admin_1.AdminEnumController.getCategory);
exports.superAdminEnumsRouter.delete('/rem-category/:id', enums_admin_1.AdminEnumController.remCategory);
exports.superAdminEnumsRouter.put('/update-category/:catId', (0, requestValidator_1.requestValidator)(admin_1.updateCategorySchema), enums_admin_1.AdminEnumController.updateCategory);
// *** cast
exports.superAdminEnumsRouter.post('/add-cast', (0, requestValidator_1.requestValidator)(admin_1.addCastSchema), enums_admin_1.AdminEnumController.addCast);
exports.superAdminEnumsRouter.get('/get-cast', enums_admin_1.AdminEnumController.getCast);
exports.superAdminEnumsRouter.delete('/rem-cast/:id', enums_admin_1.AdminEnumController.remcast);
