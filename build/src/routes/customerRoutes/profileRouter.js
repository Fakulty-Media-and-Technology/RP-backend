"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const profile_customer_1 = require("../../controllers/customers/profile.customer");
exports.router = (0, express_1.Router)();
exports.router.get('/fetch', profile_customer_1.CustomerProfileController.customerProfileFetch);
