"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const onboarding_customer_1 = require("../../controllers/customers/onboarding.customer");
exports.router = (0, express_1.Router)();
exports.router.get('/general/validate-token', onboarding_customer_1.OnboardingController.authTokenValidity);
exports.router.get('/general/validate-reftoken', onboarding_customer_1.OnboardingController.refTokenValidity);
exports.router.get('/general/renew-accesstoken', onboarding_customer_1.OnboardingController.refreshAccessToken);
