"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const pushNotification_customer_1 = require("../../controllers/customers/pushNotification.customer");
exports.router = (0, express_1.Router)();
exports.router.post('/device/register', pushNotification_customer_1.CustomerPushNotificationController.registerDeviceToken);
exports.router.post('/device/update', pushNotification_customer_1.CustomerPushNotificationController.updateDeviceToken);
