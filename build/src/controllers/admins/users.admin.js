"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersController = void 0;
const users_model_1 = require("../../models/users.model");
const catchAsync_1 = require("../../utils/catchAsync");
const OperationalError_1 = require("../../utils/OperationalError");
const Password_1 = require("../../utils/Password");
const responder_1 = require("../../utils/responder");
const validate_1 = require("../../utils/validate");
class AdminUsersController {
}
exports.AdminUsersController = AdminUsersController;
_a = AdminUsersController;
AdminUsersController.adminFetchUser = catchAsync_1.Catch.async(async (_, res) => {
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
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: result,
        message: 'User detials fetched',
    });
});
AdminUsersController.adminFetchSingleUser = catchAsync_1.Catch.async(async (req, res) => {
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
    if (!user) {
        throw new OperationalError_1.OperationalError('User not found', 404);
    }
    (0, responder_1.sendResponse)({
        res,
        data: user,
        message: 'One user fetched successfully',
    });
});
AdminUsersController.editUserProfile = catchAsync_1.Catch.async(async (req, res) => {
    const { userId } = req.params;
    const { first_name, last_name, mobile, dob, email, gender, password } = req.body;
    if (email && !(0, validate_1.isValidEmail)(email)) {
        throw new OperationalError_1.OperationalError('Invalid email format', 400);
    }
    const updatedUser = await users_model_1.UserModel.findOneAndUpdate({
        _id: userId,
    }, {
        email: email,
        password: await Password_1.Password.encrypt(password),
        first_name: first_name,
        last_name: last_name,
        mobile: mobile,
        gender: gender,
        dob: dob,
        verified: true,
        approved: true,
    }, { new: true });
    if (!updatedUser) {
        throw new OperationalError_1.OperationalError('User not found', 400);
    }
    (0, responder_1.sendResponse)({
        res,
        data: updatedUser,
        message: 'profile updated',
    });
});
AdminUsersController.adminDeleteUser = catchAsync_1.Catch.async(async (req, res) => {
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
