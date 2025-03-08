"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUsersService = void 0;
const s3_1 = require("../aws/s3");
const users_model_1 = require("../../models/users.model");
const UserRepo_1 = require("../../repositories/UserRepo");
const OperationalError_1 = require("../../utils/OperationalError");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const photoUtils_1 = require("../../utils/photoUtils");
const promises_1 = require("../../utils/promises");
class AdminUsersService {
}
exports.AdminUsersService = AdminUsersService;
_a = AdminUsersService;
AdminUsersService.fetchAll = async (query) => {
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 50);
    const users = await UserRepo_1.UserRepo.adminFetchAllCustomersAggr(page, limit);
    return (0, promises_1.getPromiseAllFulfilledResults)(await Promise.allSettled(users.map(photoUtils_1.PhotoUtils.fetchUserAggrResPhoto)));
};
AdminUsersService.fetchOne = async (userId) => {
    const [user] = await UserRepo_1.UserRepo.adminFetchSingleCustomerAggr(userId);
    if (!user) {
        throw new OperationalError_1.OperationalError('User not found', 404);
    }
    return await photoUtils_1.PhotoUtils.fetchUserAggrResPhoto(user);
};
AdminUsersService.deleteOne = async (userId) => {
    const deletedUser = await users_model_1.UserModel.findByIdAndDelete(userId);
    if (!deletedUser) {
        throw new OperationalError_1.OperationalError('user can not be deleted or not found', 400);
    }
    if (deletedUser.photo) {
        const { photo: { Key, Bucket }, } = deletedUser;
        s3_1.S3.deleteObject(Key, Bucket).catch(e => {
            console.error(`Error deleted user photo with key: ${Key} and bucket: ${Bucket}`);
            console.error('Reason', e);
        });
    }
};
