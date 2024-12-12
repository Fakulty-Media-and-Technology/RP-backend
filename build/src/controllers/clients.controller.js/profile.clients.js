"use strict";
const PaymentsModel = require('../../models/payments.model');
const UsersModel = require('../../models/users.model');
const WalletModel = require('../../models/wallet.model');
const { readPhotos } = require('../../services/media-access');
const { serverError, successResponse, failedResponse, invalidRequest, } = require('../../utils/response.handler');
exports.clientProfileFetch = async (req, res) => {
    try {
        const user = req.user;
        const profile = await UsersModel.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            '$_id',
                            {
                                $toObjectId: user._id,
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
        const signedUrl = await readPhotos(profile[0]?.photo?.Bucket, profile[0]?.photo?.Key);
        return successResponse(res, 200, {
            profile: profile[0],
            photo_url: signedUrl.status == 400 ? 'no profile picture' : signedUrl,
        }, 'client profile fetched');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.clientsPaymentHis = async (req, res) => {
    try {
        const user = req.user;
        const wallHis = await PaymentsModel.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            '$user_id',
                            {
                                $toObjectId: user._id,
                            },
                        ],
                    },
                },
            },
        ]);
        return successResponse(res, 200, wallHis, 'client payment history fetched');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.clientEditProfile = async (req, res) => {
    try {
        const user = req.user;
        const { first_name, last_name, country_code, mobile, photo } = req.body;
        const initData = await UsersModel.findOne({ _id: user.id });
        await UsersModel.findOneAndUpdate({
            _id: user.id,
        }, {
            first_name: first_name ? first_name : initData.first_name,
            last_name: last_name ? last_name : initData.last_name,
            country_code: country_code ? country_code : initData.country_code,
            mobile: mobile ? mobile : initData.mobile,
            photo: photo ? photo : initData.photo,
        });
        return successResponse(res, 200, null, 'profile updated');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
