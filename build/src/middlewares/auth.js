"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const env_1 = __importDefault(require("../env"));
const UserRepo_1 = require("../repositories/UserRepo");
const Catch_1 = require("../utils/Catch");
const jwt_1 = require("../utils/jwt");
const OperationalError_1 = require("../utils/OperationalError");
class AuthMiddleware {
}
exports.AuthMiddleware = AuthMiddleware;
_a = AuthMiddleware;
AuthMiddleware._checkRolePermission = (authHeaderType, user) => {
    switch (authHeaderType) {
        case 'clients-auth':
            const permittedRoles = ['channel', 'tvshow', 'event', 'podcast'];
            if (!permittedRoles.includes(user.role)) {
                throw new OperationalError_1.OperationalError('Access Denied, clients Route', 403);
            }
            break;
        case 'superadmin-auth':
            if (user.role !== 'superadmin') {
                throw new OperationalError_1.OperationalError('Access Denied, superadmin Route', 403);
            }
            break;
        case 'admin-auth':
            if (user.role !== 'admin') {
                throw new OperationalError_1.OperationalError('Access Denied, admin Route', 403);
            }
            break;
        case 'customer-auth':
            // Prevents the defualt block from being executed
            break;
        default:
            console.error('🛑AuthController._checkRolePermission should never log this line. Investigate');
            break;
    }
};
AuthMiddleware.authenticateRequest = (authHeaderkey) => Catch_1.Catch.async(async (req, _, next) => {
    const token = req.headers[authHeaderkey];
    if (typeof token !== 'string') {
        throw new OperationalError_1.OperationalError('User not logged in', 401);
    }
    if (token === env_1.default.GUEST_TOKEN) {
        req.user = {
            first_name: 'guest',
            last_name: 'user',
            role: 'guest',
        };
        return next();
    }
    // this throws and is handled at the app layer
    const authUser = await jwt_1.TokenManager.decode(token, 'access');
    const user = await UserRepo_1.UserRepo.getUserById(authUser.id);
    if (user === null) {
        throw new OperationalError_1.OperationalError('User does not exist', 401);
    }
    if (user.suspended) {
        throw new OperationalError_1.OperationalError('You are suspended', 403);
    }
    _a._checkRolePermission(authHeaderkey, user);
    req.user = user;
    next();
});
