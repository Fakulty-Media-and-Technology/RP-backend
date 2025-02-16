"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const notifications_customer_1 = require("../../controllers/customers/notifications.customer");
exports.router = (0, express_1.Router)();
exports.router.get('/', notifications_customer_1.CustomerNotificationController.getNotifications);
exports.router.post('=:notification_id/click', notifications_customer_1.CustomerNotificationController.handleNotificationClick);
