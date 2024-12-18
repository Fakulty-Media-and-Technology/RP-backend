"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const OnboardingService_1 = require("../../services/core/OnboardingService");
const catchAsync_1 = require("../../utils/catchAsync");
const OperationalError_1 = require("../../utils/OperationalError");
const responder_1 = require("../../utils/responder");
class OnboardingController {
}
exports.OnboardingController = OnboardingController;
_a = OnboardingController;
OnboardingController.customerSignup = catchAsync_1.Catch.async(async ({ body }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'New Customer Account Created successfully',
        data: await OnboardingService_1.OnboardingService.createCustomer(body),
    });
});
OnboardingController.createPin = catchAsync_1.Catch.async(async ({ body }, res) => {
    await OnboardingService_1.OnboardingService.createPin(body);
    (0, responder_1.sendResponse)({
        res,
        message: 'Pin created successfully',
    });
});
OnboardingController.verifyAccount = catchAsync_1.Catch.async(async (req, res) => {
    const { email, token } = req.body;
    if (!email || !token) {
        throw new OperationalError_1.OperationalError('user email and sent token are required', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'user account verified',
        data: await OnboardingService_1.OnboardingService.verifyAccount(email, token),
    });
});
OnboardingController.signIn = catchAsync_1.Catch.async(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new OperationalError_1.OperationalError('all input are required', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'Sign In successful',
        data: await OnboardingService_1.OnboardingService.signIn(email, password),
    });
});
OnboardingController.authTokenValidity = catchAsync_1.Catch.async(async (req, res) => {
    const { token } = req.query;
    (0, responder_1.sendResponse)({
        res,
        message: 'access token is still valid',
        data: { valid: await OnboardingService_1.OnboardingService.validateToken(token, 'access') },
    });
});
OnboardingController.refTokenValidity = catchAsync_1.Catch.async(async (req, res) => {
    const { token } = req.query;
    (0, responder_1.sendResponse)({
        res,
        message: 'refresh token is still valid',
        data: { valid: await OnboardingService_1.OnboardingService.validateToken(token, 'refresh') },
    });
});
OnboardingController.refreshAccessToken = catchAsync_1.Catch.async(async (req, res) => {
    const { ref_token } = req.query;
    if (typeof ref_token !== 'string') {
        throw new OperationalError_1.OperationalError('required query.ref_token must be a string', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'new access token generated from refresh token',
        data: await OnboardingService_1.OnboardingService.refreshAccessToken(ref_token),
    });
});
OnboardingController.passwordChange = catchAsync_1.Catch.async(async ({ body }, res) => {
    await OnboardingService_1.OnboardingService.changePassword(body);
    (0, responder_1.sendResponse)({ res, message: 'password changed successfully' });
});
OnboardingController.getVerificationToken = catchAsync_1.Catch.async(async (req, res) => {
    const u_email = req.query.email;
    if (typeof u_email !== 'string') {
        throw new OperationalError_1.OperationalError('required query.u_email must be a string', 400);
    }
    await OnboardingService_1.OnboardingService.getVerificationToken(u_email);
    (0, responder_1.sendResponse)({
        res,
        message: 'verification code sent to registered email successfully',
    });
});
OnboardingController.passwordChangeCode = catchAsync_1.Catch.async(async (req, res) => {
    const { email } = req.body;
    if (typeof email !== 'string') {
        throw new OperationalError_1.OperationalError('required body.email must be a string', 400);
    }
    await OnboardingService_1.OnboardingService.changePasswordCode(email);
    (0, responder_1.sendResponse)({
        res,
        message: 'password reset email sent to registered email',
    });
});
