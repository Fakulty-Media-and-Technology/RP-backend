"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genRandUniqId = exports.authCode = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const authCode = (digit) => {
    let pin = '';
    for (let i = 0; i < digit; i++) {
        const num = Math.floor(Math.random() * 10);
        pin += num;
    }
    return pin;
};
exports.authCode = authCode;
const genRandUniqId = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsLength = chars.length;
    const randomBytes = node_crypto_1.default.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        const indexedByte = randomBytes[i];
        const randIndex = indexedByte % charsLength;
        const randChar = chars[randIndex];
        result += randChar;
    }
    return result;
};
exports.genRandUniqId = genRandUniqId;
