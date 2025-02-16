"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const env_1 = __importDefault(require("../env"));
class TokenManager {
}
exports.TokenManager = TokenManager;
TokenManager.decode = (token, type) => new Promise((resolve, reject) => {
    const secret = type === 'access' ? env_1.default.JWT_SECRET : env_1.default.JWT_SECRET_REFRESH_TOKEN;
    (0, jsonwebtoken_1.verify)(token, secret, (err, payload) => {
        if (err)
            reject(err);
        else
            resolve(payload);
    });
});
TokenManager.sign = (type, payload) => {
    const isAccessToken = type === 'access';
    const secret = isAccessToken ? env_1.default.JWT_SECRET : env_1.default.JWT_SECRET_REFRESH_TOKEN;
    return (0, jsonwebtoken_1.sign)(payload, secret, { expiresIn: isAccessToken ? '7d' : '30d' });
};
TokenManager.logout = (payload) => (0, jsonwebtoken_1.sign)(payload, env_1.default.JWT_SECRET, { expiresIn: '1' });
