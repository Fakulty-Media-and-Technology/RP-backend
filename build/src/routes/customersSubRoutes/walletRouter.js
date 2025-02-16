"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const payment_customer_1 = require("../../controllers/customers/payment.customer");
exports.router = (0, express_1.Router)();
exports.router.post('/topup', payment_customer_1.CustomerPaymentController.topupWallet);
exports.router.get('/fetch', payment_customer_1.CustomerPaymentController.fetchWallet);
