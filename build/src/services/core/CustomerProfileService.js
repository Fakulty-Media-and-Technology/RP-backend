"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerProfileService = void 0;
const media_access_1 = require("../../../src/services/media-access");
const media_management_1 = require("../../../src/services/media-management");
const suggestions_model_1 = require("../../models/suggestions.model");
const users_model_1 = require("../../models/users.model");
const OperationalError_1 = require("../../utils/OperationalError");
const validate_1 = require("../../utils/validate");
class CustomerProfileService {
}
exports.CustomerProfileService = CustomerProfileService;
_a = CustomerProfileService;
CustomerProfileService.fetchCustomerProfile = async ({ currentUser, currentUserRoleHybrid, }) => {
    if (currentUserRoleHybrid === 'guest') {
        throw new OperationalError_1.OperationalError('You are not authenticated', 403);
    }
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
                from: 'paymentdetails',
                let: {
                    uid: '$_id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    '$user_id',
                                    {
                                        $toObjectId: '$$uid',
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            __v: 0,
                            _id: 0,
                            user_id: 0,
                        },
                    },
                ],
                as: 'paymentDetails',
            },
        },
        {
            $addFields: {
                paymentDetails: {
                    $arrayElemAt: ['$paymentDetails', 0],
                },
            },
        },
        {
            $lookup: {
                from: 'settings',
                let: {
                    cid: '$_id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$$cid', '$user_id'],
                            },
                        },
                    },
                    {
                        $project: {
                            createdAt: 0,
                            updatedAt: 0,
                            __v: 0,
                        },
                    },
                ],
                as: 'settings_info',
            },
        },
        {
            $set: {
                settings_info: {
                    $first: '$settings_info',
                },
            },
        },
        {
            $project: {
                __v: 0,
                password: 0,
                auth_code: 0,
                auth_expiry: 0,
                verified: 0,
                approved: 0,
                suspended: 0,
            },
        },
    ]);
    if (!profile.length) {
        return {
            data: {
                profile: null,
                photo_url: 'no profile picture',
            },
            message: 'Customer profile fetched but no profile data',
        };
    }
    const userPhoto = profile[0]?.photo;
    if (!userPhoto || !userPhoto.Bucket || !userPhoto.Key) {
        return {
            data: {
                profile: profile[0],
                photo_url: 'no profile picture',
            },
            message: 'Client profile fetched',
        };
    }
    return {
        data: {
            profile: profile[0],
            photo_url: await media_access_1.MediaAccess.getSignedUrl(userPhoto.Bucket, userPhoto.Key, 'photo'),
        },
        message: 'Client profile fetched',
    };
};
CustomerProfileService.createSuggestion = async (currentUser, message) => {
    const currentUserRole = currentUser.role;
    if (currentUserRole === 'guest') {
        throw new OperationalError_1.OperationalError('you are not authenticated', 403);
    }
    await suggestions_model_1.SuggestionModel.create({
        message,
        user_id: currentUser._id,
    });
};
CustomerProfileService.editProfile = async (currentUser, data) => {
    const { first_name, last_name, country_code, mobile, photo, email, payment } = data;
    if (email) {
        if (!(0, validate_1.isValidEmail)(email)) {
            console.log('Invalid email format:', email);
            throw new OperationalError_1.OperationalError('invalid email format', 400);
        }
        if (await users_model_1.UserModel.findOne({ email: email })) {
            console.log('Email already in use:', email);
            throw new OperationalError_1.OperationalError('invalid email format', 409);
        }
    }
    if (photo) {
        await media_management_1.MediaManagement.deletePhoto(currentUser.photo);
        currentUser.photo = {};
    }
    const updatedUser = await users_model_1.UserModel.findByIdAndUpdate(currentUser._id, {
        email: email ? email : currentUser.email,
        first_name: first_name ? first_name : currentUser.first_name,
        last_name: last_name ? last_name : currentUser.last_name,
        country_code: country_code ? country_code : currentUser.country_code,
        mobile: mobile ? mobile : currentUser.mobile,
        photo: photo ? photo : currentUser.photo,
    });
    if (updatedUser === null) {
        throw new OperationalError_1.OperationalError('error updating profile. Please try again', 500);
    }
};
