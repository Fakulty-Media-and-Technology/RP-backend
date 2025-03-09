"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepo = void 0;
const users_model_1 = require("../models/users.model");
const QueryParamsFeatures_1 = require("../utils/QueryParamsFeatures");
const VideoRepo_1 = require("./VideoRepo");
class UserRepo {
}
exports.UserRepo = UserRepo;
_a = UserRepo;
UserRepo.getUserById = (userId) => users_model_1.UserModel.findById(userId);
UserRepo.getByEmail = (emailAddr) => {
    return users_model_1.UserModel.findOne({ email: emailAddr.trim().toLowerCase() });
};
UserRepo.totalUsersCount = () => users_model_1.UserModel.find({}).countDocuments();
UserRepo.getAdminById = (adminId) => {
    return users_model_1.UserModel.findOne({ _id: adminId, role: { $in: ['admin', 'superadmin'] } });
};
UserRepo.getAllClientsByRoles = (roles = ['tvshow', 'channel', 'podcast', 'event']) => {
    return users_model_1.UserModel.find({
        role: { $in: roles },
    });
};
UserRepo.getClientByRolesAndId = (id, roles) => {
    return users_model_1.UserModel.findOne({ _id: id, role: { $in: roles } });
};
UserRepo.updateById = (userId, data) => {
    return users_model_1.UserModel.findByIdAndUpdate(userId, data, { new: true });
};
UserRepo.searchUsersByRegexQuery = (searchReg) => users_model_1.UserModel.find({
    role: { $in: ['channel', 'tvshow', 'event', 'podcast'] },
    $or: [
        { first_name: { $regex: searchReg } },
        { last_name: { $regex: searchReg } },
        { email: { $regex: searchReg } },
    ],
}).select('_id first_name last_name role');
UserRepo.getFreeUsers = async () => {
    return await users_model_1.UserModel.aggregate([
        {
            $lookup: {
                from: 'subscriptions',
                let: {
                    uid: '$_id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $eq: [
                                            '$user_id',
                                            {
                                                $toObjectId: '$$uid',
                                            },
                                        ],
                                    },
                                    {
                                        $eq: ['$active', true],
                                    },
                                    {
                                        $lte: [
                                            new Date(),
                                            {
                                                $toDate: '$expiry_date',
                                            },
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                ],
                as: 'user_sub',
            },
        },
        {
            $match: {
                $expr: {
                    $eq: ['$user_sub', []],
                },
            },
        },
    ]);
};
UserRepo.getAClient = (clinetId) => {
    return users_model_1.UserModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: [
                        '$_id',
                        {
                            $toObjectId: clinetId,
                        },
                    ],
                },
            },
        },
        {
            $lookup: {
                from: 'payments',
                localField: '_id',
                foreignField: 'user_id',
                as: 'payment history',
                pipeline: [
                    {
                        $sort: {
                            createdAt: -1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                auth_code: 0,
                auth_expiry: 0,
                approved: 0,
                suspended: 0,
                updatedAt: 0,
                __v: 0,
                pin: 0,
                password: 0,
            },
        },
    ]);
};
UserRepo._adminFetchUsers = async (match, page, limit, showPaymentHistory = false) => {
    const pipeline = [
        match,
        {
            $project: {
                fullname: {
                    $concat: ['$first_name', ' ', '$last_name'],
                },
                mobile: true,
                country: true,
                gender: true,
                dob: true,
                photo: true,
                country_code: true,
                role: true,
                email: true,
                totalSub: true,
                joined: '$createdAt',
                substatus: {
                    $cond: {
                        if: { $eq: ['$verified', true] },
                        then: 'Active',
                        else: 'Inactive',
                    },
                },
                verified: true,
            },
        },
        { $skip: (0, QueryParamsFeatures_1.skip)(page, limit) },
        { $limit: limit },
    ];
    if (showPaymentHistory) {
        pipeline.push({
            $lookup: {
                from: 'payments',
                localField: '_id',
                foreignField: 'user_id',
                as: 'payment history',
            },
        });
    }
    const result = (await users_model_1.UserModel.aggregate(pipeline));
    return result;
};
UserRepo.adminFetchClientsBySearchAggr = async (searchReg, page, limit) => {
    return _a._adminFetchUsers({
        $match: {
            role: { $in: ['channel', 'tvshow', 'event', 'podcast'] },
            $or: [
                { first_name: { $regex: searchReg } },
                { last_name: { $regex: searchReg } },
                { email: { $regex: searchReg } },
            ],
        },
    }, page, limit);
};
UserRepo.adminFetchClientAggrById = async (clientId) => {
    return _a._adminFetchUsers({ $match: { _id: (0, VideoRepo_1.toObjectId)(clientId) } }, 1, 1, true);
};
UserRepo.adminFetchAllClientsAggr = async (page, limit) => {
    return _a._adminFetchUsers({ $match: { role: { $in: ['tvshow', 'channel', 'podcast', 'event'] } } }, page, limit);
};
UserRepo.adminFetchAllCustomersAggr = async (page, limit) => {
    return _a._adminFetchUsers({ $match: { role: 'customer' } }, page, limit);
};
UserRepo.adminFetchSingleCustomerAggr = (userId) => {
    return _a._adminFetchUsers({ $match: { _id: (0, VideoRepo_1.toObjectId)(userId), role: 'customer' } }, 1, 1);
};
