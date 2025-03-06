"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPaymentController = void 0;
const CustomenrPaymentService_1 = require("../../services/core/CustomenrPaymentService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const OperationalError_1 = require("../../utils/OperationalError");
const responder_1 = require("../../utils/responder");
class CustomerPaymentController {
}
exports.CustomerPaymentController = CustomerPaymentController;
_a = CustomerPaymentController;
CustomerPaymentController.startPayment = Catch_1.Catch.async(async ({ user, body }, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CustomenrPaymentService_1.CustomerPaymentService.startPayment(GetDefined_1.GetDefined.loggedInUser(user), body),
        message: 'payment initiated',
    });
});
CustomerPaymentController.authorizePayment = Catch_1.Catch.async(async ({ user, body: { amount_charge } }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'payment authorization successfull',
        data: await CustomenrPaymentService_1.CustomerPaymentService.authorizePayment(GetDefined_1.GetDefined.loggedInUser(user), amount_charge),
    });
});
CustomerPaymentController.createPayment = Catch_1.Catch.async(async ({ user, body }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'payment created and authorization activated',
        data: await CustomenrPaymentService_1.CustomerPaymentService.createPayment(GetDefined_1.GetDefined.loggedInUser(user), body),
    });
});
CustomerPaymentController.getPaymentReceipt = Catch_1.Catch.async(async (req, res) => {
    const { reference } = req.query;
    if (typeof reference !== 'string') {
        throw new OperationalError_1.OperationalError('required query.reference must be a string', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        data: await CustomenrPaymentService_1.CustomerPaymentService.getPaymentRecepit(reference),
        message: 'Payment initiated',
    });
});
CustomerPaymentController.transactionHistory = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CustomenrPaymentService_1.CustomerPaymentService.getTransactionHistory(GetDefined_1.GetDefined.loggedInUser(req.user)),
        message: 'transaction history fetched',
    });
});
CustomerPaymentController.addPayment = Catch_1.Catch.async(async ({ user, body }, res) => {
    await CustomenrPaymentService_1.CustomerPaymentService.addPayment(GetDefined_1.GetDefined.loggedInUser(user), body);
    (0, responder_1.sendResponse)({
        res,
        message: 'Payment added successfully',
    });
});
CustomerPaymentController.fetchPlans = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CustomenrPaymentService_1.CustomerPaymentService.fetchPlans(req.query),
        message: 'Plans Fetched',
    });
});
CustomerPaymentController.createSubscription = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: await CustomenrPaymentService_1.CustomerPaymentService.createSub({
            user: GetDefined_1.GetDefined.loggedInUser(req.user),
            data: req.body,
        }),
    });
});
CustomerPaymentController.userSubStatus = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CustomenrPaymentService_1.CustomerPaymentService.fetchSubStatus(GetDefined_1.GetDefined.loggedInUser(req.user)),
        message: 'subscription status fetched',
    });
});
CustomerPaymentController.topupWallet = Catch_1.Catch.async(async (req, res) => {
    await CustomenrPaymentService_1.CustomerPaymentService.topUpWallet({
        user: GetDefined_1.GetDefined.loggedInUser(req.user),
        reference: req.body.reference,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'top up successful',
    });
});
CustomerPaymentController.fetchWallet = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        data: await CustomenrPaymentService_1.CustomerPaymentService.fetchWallet(GetDefined_1.GetDefined.loggedInUser(req.user)),
        message: 'user allet info',
    });
});
CustomerPaymentController.redeemGiftCard = Catch_1.Catch.async(async (req, res) => {
    await CustomenrPaymentService_1.CustomerPaymentService.redeemGiftCard({
        user: GetDefined_1.GetDefined.loggedInUser(req.user),
        giftCode: req.query.gift_code,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'giftcard has been redeemed and credited to your wallet successfully',
    });
});
