"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminUsersRouter = void 0;
const express_1 = require("express");
const users_admin_1 = require("../../controllers/admins/users.admin");
exports.superAdminUsersRouter = (0, express_1.Router)();
exports.superAdminUsersRouter.get('/fetch', users_admin_1.AdminUsersController.adminFetchUsers);
exports.superAdminUsersRouter.get('/fetch/:userId', users_admin_1.AdminUsersController.adminFetchSingleUser);
exports.superAdminUsersRouter.delete('/deleteUser/:userId', users_admin_1.AdminUsersController.adminDeleteUser);
