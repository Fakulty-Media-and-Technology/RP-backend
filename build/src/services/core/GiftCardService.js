"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftCardService = void 0;
const giftcard_model_1 = require("../../models/giftcard.model");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const strGen_1 = require("../../utils/strGen");
const getUniqueGiftCode = async (triesCount = 1) => {
    if (triesCount >= 5) {
        throw new OperationalError_1.OperationalError('Cannot generate giftCode, please try again', 500);
    }
    const uniq_code = (0, strGen_1.genRandUniqId)(12).toUpperCase();
    // TODO: this can be optimized
    const giftCard = await giftcard_model_1.GiftCardModel.findOne({
        code: uniq_code,
    });
    if (giftCard) {
        return await getUniqueGiftCode(++triesCount);
    }
    return uniq_code;
};
class GiftCardService {
}
exports.GiftCardService = GiftCardService;
_a = GiftCardService;
GiftCardService.createGiftCard = async (currentAdmin, amount) => {
    const giftCards = await giftcard_model_1.GiftCardModel.find({}).sort({
        createdAt: -1,
        serial_number: -1,
    });
    const serialN = giftCards.length > 0 ? giftCards[0].serial_number : 0;
    const newGiftCard = await giftcard_model_1.GiftCardModel.create({
        admin_id: currentAdmin._id,
        serial_number: serialN + 1,
        code: await getUniqueGiftCode(),
        amount,
    });
    return newGiftCard;
};
GiftCardService.fetchGiftCards = async (page, limit) => {
    const cards = await giftcard_model_1.GiftCardModel.aggregate([
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
            $skip: (0, QueryParamsFeatures_1.skip)(page, limit),
        },
        {
            $limit: limit,
        },
    ]);
    return cards;
};
