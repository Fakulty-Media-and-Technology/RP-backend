"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.denyGuestUser = void 0;
const OperationalError_1 = require("./OperationalError");
const denyGuestUser = (user) => {
    if (!user._id && user.role === 'guest') {
        throw new OperationalError_1.OperationalError('you are not authorized', 403);
    }
};
exports.denyGuestUser = denyGuestUser;
