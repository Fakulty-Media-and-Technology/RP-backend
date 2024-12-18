"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientProfileService = void 0;
const payments_model_1 = require("../../models/payments.model");
const users_model_1 = require("../../models/users.model");
const media_access_1 = require("../media-access");
class ClientProfileService {
}
exports.ClientProfileService = ClientProfileService;
_a = ClientProfileService;
ClientProfileService.editProfile = async (currentUser, data) => {
    const { first_name, last_name, country_code, mobile, photo } = data;
    const updatedClient = await users_model_1.UserModel.findByIdAndUpdate(currentUser.id, {
        first_name: first_name ? first_name : currentUser.first_name,
        last_name: last_name ? last_name : currentUser.last_name,
        country_code: country_code ? country_code : currentUser.country_code,
        mobile: mobile ? mobile : currentUser.mobile,
        photo: photo ? photo : currentUser.photo,
    }, { new: true });
    return updatedClient;
};
ClientProfileService.clientsPaymentHis = async (currentUser) => {
    const wallHis = await payments_model_1.PaymentModel.find({ user_id: currentUser.id });
    return wallHis;
};
ClientProfileService.fetchClientProfile = async (currentUser) => {
    const profile = await users_model_1.UserModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: [
                        '$_id',
                        {
                            $toObjectId: currentUser._id,
                        },
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'wallets',
                let: {
                    cid: '$_id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    '$user_id',
                                    {
                                        $toObjectId: '$$cid',
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            balance: 1,
                        },
                    },
                ],
                as: 'wallet_bal',
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
            $project: {
                auth_code: 0,
                auth_expiry: 0,
                verified: 0,
                approved: 0,
                suspended: 0,
                updatedAt: 0,
                __v: 0,
                pin: 0,
                password: 0,
            },
        },
    ]);
    const signedUrl = await (0, media_access_1.readPhotos)(profile[0]?.photo?.Bucket, profile[0]?.photo?.Key);
    return {
        profile: profile[0],
        photo_url: typeof signedUrl !== 'string' && signedUrl.status == 400 ? 'no profile picture' : signedUrl,
    };
};
