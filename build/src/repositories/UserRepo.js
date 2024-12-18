"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepo = void 0;
const users_model_1 = require("../models/users.model");
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
                        $sort: {
                            createdAt: -1,
                        },
                    },
                ],
                as: 'payment history',
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
