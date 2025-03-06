"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hidePrivateProps = void 0;
const hidePrivateProps = (user) => ({
    ...user.toObject(),
    auth_code: undefined,
    auth_expiry: undefined,
    verified: undefined,
    approved: undefined,
    suspended: undefined,
    updatedAt: undefined,
    __v: undefined,
    pin: undefined,
    password: undefined,
});
exports.hidePrivateProps = hidePrivateProps;
