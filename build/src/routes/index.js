"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.v1Router = void 0;
const express_1 = __importDefault(require("express"));
const superadmin_route_1 = require("./superadmin.route");
const admin_route_1 = require("./admin.route");
const clients_route_1 = require("./clients.route");
const customers_route_1 = require("./customers.route");
exports.v1Router = express_1.default.Router();
exports.v1Router.use('/customers', customers_route_1.customerRouter);
exports.v1Router.use('/clients', clients_route_1.clientsRouter);
exports.v1Router.use('/admin', admin_route_1.adminRouter);
exports.v1Router.use('/superadmin', superadmin_route_1.superAdminRouter);
exports.default = exports.v1Router;
