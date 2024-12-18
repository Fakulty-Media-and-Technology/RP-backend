"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Password = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
class Password {
}
exports.Password = Password;
_a = Password;
Password.isStrong = (password) => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[a-zA-Z]).{8,}$/.test(password);
Password.encrypt = async (password) => bcrypt_1.default.hash(password, 12);
Password.compare = async (plainPassword, hashedPassword) => bcrypt_1.default.compare(plainPassword, hashedPassword);
