"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminClientsRouter = void 0;
const express_1 = require("express");
const clients_admin_1 = require("../../controllers/admins/clients.admin");
exports.superAdminClientsRouter = (0, express_1.Router)();
exports.superAdminClientsRouter.get('/allfetch', clients_admin_1.AdminClientsController.getAllClients);
exports.superAdminClientsRouter.get('/onefetch/:id', clients_admin_1.AdminClientsController.getClient);
exports.superAdminClientsRouter.get('/deposits', clients_admin_1.AdminClientsController.clientDeposits);
