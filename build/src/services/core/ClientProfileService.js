"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientProfileService = void 0;
const media_access_1 = require("../../../src/services/media-access");
const payments_model_1 = require("../../models/payments.model");
const users_model_1 = require("../../models/users.model");
class ClientProfileService {
}
exports.ClientProfileService = ClientProfileService;
_a = ClientProfileService;
ClientProfileService._deselect = {
    auth_code: 0,
    auth_expiry: 0,
    verified: 0,
    approved: 0,
    suspended: 0,
    updatedAt: 0,
    __v: 0,
    pin: 0,
    password: 0,
};
ClientProfileService.clientsPaymentHis = async (currentUser) => {
    const wallHis = await payments_model_1.PaymentModel.find({ user_id: currentUser.id }).select('-__v');
    return wallHis;
};
ClientProfileService.fetchClientProfile = async (currentUser) => {
    const profile = await users_model_1.UserModel.aggregate([
        {
            $match: {
                _id: currentUser._id,
            },
        },
        {
            $lookup: {
                from: 'wallets',
                localField: '_id',
                foreignField: 'user_id',
                as: 'wallet_bal',
                pipeline: [
                    {
                        $project: {
                            balance: 1,
                        },
                    },
                ],
            },
        },
        {
            $set: {
                wallet_bal: {
                    $first: '$wallet_bal',
                },
            },
        },
        {
            $project: _a._deselect,
        },
    ]);
    const _profile = profile[0];
    const _photo_url = await media_access_1.MediaAccess.getSignedUrl(_profile.photo?.Bucket, _profile.photo?.Key, 'photo');
    return {
        profile: _profile,
        photo_url: _photo_url,
    };
};
