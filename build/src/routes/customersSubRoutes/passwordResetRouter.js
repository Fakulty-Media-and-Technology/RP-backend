"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const onboarding_customer_1 = require("../../controllers/customers/onboarding.customer");
exports.router = (0, express_1.Router)();
exports.router.post('/get-token', onboarding_customer_1.OnboardingController.passwordChangeCode);
exports.router.post('/change-pass', onboarding_customer_1.OnboardingController.passwordChange);
