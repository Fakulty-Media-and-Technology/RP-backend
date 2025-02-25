"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersController = void 0;
const users_model_1 = require("../../models/users.model");
const Catch_1 = require("../../utils/Catch");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
class AdminUsersController {
}
exports.AdminUsersController = AdminUsersController;
_a = AdminUsersController;
AdminUsersController.adminFetchUsers = Catch_1.Catch.async(async ({ query }, res) => {
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 50);
    const result = await users_model_1.UserModel.aggregate([
        {
            $project: {
                fullname: {
                    $concat: ['$first_name', ' ', '$last_name'],
                },
                email: 1,
                totalSub: 1,
                joined: '$createdAt',
                substatus: {
                    $cond: {
                        if: { $eq: ['$verified', true] },
                        then: 'Active',
                        else: 'Inactive',
                    },
                },
                verified: 1,
            },
        },
        { $skip: (0, QueryParamsFeatures_1.skip)(page, limit) },
        { $limit: limit },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: result,
        message: 'User detials fetched',
    });
});
AdminUsersController.adminFetchSingleUser = Catch_1.Catch.async(async (req, res) => {
    const { userId } = req.params;
    const user = await users_model_1.UserModel.aggregate([
        {
            $match: {
                $expr: {
                    $eq: [
                        '$_id',
                        {
                            $toObjectId: userId,
                        },
                    ],
                },
            },
        },
        {
            $project: {
                fullname: {
                    $concat: [{ $ifNull: ['$first_name', ''] }, ' ', { $ifNull: ['$last_name', ''] }],
                },
                email: 1,
                mobile: 1,
                gender: 1,
                dob: 1,
                joined: '$createdAt',
                verified: 1,
                substatus: {
                    $cond: {
                        if: { $eq: ['$verified', true] },
                        then: 'Active',
                        else: 'Inactive',
                    },
                },
            },
        },
    ]);
    if (!user.length) {
        throw new OperationalError_1.OperationalError('User not found', 404);
    }
    (0, responder_1.sendResponse)({
        res,
        data: user,
        message: 'One user fetched successfully',
    });
});
AdminUsersController.adminDeleteUser = Catch_1.Catch.async(async (req, res) => {
    const { userId } = req.params;
    const deleteUser = await users_model_1.UserModel.findOneAndDelete({
        _id: userId,
    });
    if (!deleteUser) {
        throw new OperationalError_1.OperationalError('user can not be deleted or not found', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'user deleted successfully',
    });
});
