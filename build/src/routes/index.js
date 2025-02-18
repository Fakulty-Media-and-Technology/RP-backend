"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.v1Router = void 0;
const express_1 = __importDefault(require("express"));
const admin_route_1 = require("./admin.route");
const clientRoutes_1 = require("./clientRoutes");
const customerRoutes_1 = require("./customerRoutes");
const superAdminRoutes_1 = require("./superAdminRoutes");
exports.v1Router = express_1.default.Router();
exports.v1Router.use('/customers', customerRoutes_1.customerRouter);
exports.v1Router.use('/clients', clientRoutes_1.clientsRouter);
exports.v1Router.use('/admin', admin_route_1.adminRouter);
exports.v1Router.use('/superadmin', superAdminRoutes_1.superAdminRouter);
exports.default = exports.v1Router;
