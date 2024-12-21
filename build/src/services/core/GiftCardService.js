"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftCardService = void 0;
const giftcard_model_1 = require("../../models/giftcard.model");
const OperationalError_1 = require("../../utils/OperationalError");
const unique_ref_1 = require("../unique-ref");
class GiftCardService {
}
exports.GiftCardService = GiftCardService;
_a = GiftCardService;
GiftCardService.createGiftCard = async (currentAdmin, amount) => {
    const uniq_code = (0, unique_ref_1.uniqueRef)();
    // TODO: this can be optimized
    const checkExist = await giftcard_model_1.GiftCardModel.findOne({
        code: uniq_code,
    });
    if (checkExist) {
        throw new OperationalError_1.OperationalError('something went wrong, please try again', 400);
    }
    const giftCards = await giftcard_model_1.GiftCardModel.find({}).sort({
        createdAt: -1,
        serial_number: -1,
    });
    const serialN = giftCards.length > 0 ? giftCards[0].serial_number : 0;
    const newGiftCard = await giftcard_model_1.GiftCardModel.create({
        admin_id: currentAdmin._id,
        serial_number: serialN + 1,
        code: uniq_code,
        amount,
    });
    return newGiftCard;
};
GiftCardService.fetchGiftCards = async (page, limit) => {
    const cards = await giftcard_model_1.GiftCardModel.aggregate([
        {
            $match: {
                $expr: {
                    $ne: ['$_id', null],
                },
            },
        },
        {
            $sort: {
                createdAt: -1,
                serial_number: -1,
            },
        },
        {
            $addFields: {
                serial_number: {
                    $concat: [
                        'SN',
                        {
                            $toString: '$serial_number',
                        },
                    ],
                },
            },
        },
        {
            $skip: page - 1 * limit,
        },
        {
            $limit: limit,
        },
    ]);
    return cards;
};
