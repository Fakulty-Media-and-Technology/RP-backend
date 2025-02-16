"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const payment_customer_1 = require("../../controllers/customers/payment.customer");
exports.router = (0, express_1.Router)();
exports.router.get('/fetch-plans', payment_customer_1.CustomerPaymentController.fetchPlans);
exports.router.post('/create', payment_customer_1.CustomerPaymentController.createSubscription);
exports.router.get('/status', payment_customer_1.CustomerPaymentController.userSubStatus);
