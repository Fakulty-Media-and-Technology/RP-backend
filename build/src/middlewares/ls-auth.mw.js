"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveStreamAuth = void 0;
const users_model_1 = require("../models/users.model");
const jwt_1 = require("../utils/jwt");
const OperationalError_1 = require("../utils/OperationalError");
const liveStreamAuth = async (token) => {
    if (!token) {
        throw new OperationalError_1.OperationalError('User not logged-in', 404);
    }
    const authUser = await jwt_1.TokenManager.decode(token, 'access');
    const user = await users_model_1.UserModel.findById(authUser.id);
    if (!user) {
        throw new OperationalError_1.OperationalError('user not found', 404);
    }
    if (user.suspended) {
        throw new OperationalError_1.OperationalError('You are Suspended, please contact the customer service', 403);
    }
    return user;
};
exports.liveStreamAuth = liveStreamAuth;
