"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = exports.validEmailReg = void 0;
exports.validEmailReg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const isValidEmail = (email) => exports.validEmailReg.test(email);
exports.isValidEmail = isValidEmail;
