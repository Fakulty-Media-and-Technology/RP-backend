"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDefined = void 0;
const OperationalError_1 = require("./OperationalError");
class GetDefined {
}
exports.GetDefined = GetDefined;
GetDefined.loggedInUser = (maybeUser) => {
    if (maybeUser == null) {
        throw new OperationalError_1.OperationalError('Please login', 401);
    }
    return maybeUser;
};
