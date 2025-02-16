"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGiftCardController = void 0;
const GiftCardService_1 = require("../../services/core/GiftCardService");
const Catch_1 = require("../../utils/Catch");
const GetDefined_1 = require("../../utils/GetDefined");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
class AdminGiftCardController {
}
exports.AdminGiftCardController = AdminGiftCardController;
_a = AdminGiftCardController;
AdminGiftCardController.createGiftCard = Catch_1.Catch.async(async ({ body: { amount }, user }, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'gift card created',
        data: await GiftCardService_1.GiftCardService.createGiftCard(GetDefined_1.GetDefined.loggedInUser(user), amount),
    });
});
AdminGiftCardController.fetchGiftCards = Catch_1.Catch.async(async ({ query }, res) => {
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    (0, responder_1.sendResponse)({
        res,
        message: 'gift cards fetched successfully',
        data: await GiftCardService_1.GiftCardService.fetchGiftCards(page, limit),
    });
});
