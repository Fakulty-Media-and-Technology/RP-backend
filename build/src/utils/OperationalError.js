"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalError = void 0;
class OperationalError extends Error {
    constructor(message, statusCode, data = {}) {
        super(message);
        this.isOperational = true;
        this.statusCode = statusCode;
        this.data = data;
        Error.captureStackTrace(this.constructor);
    }
}
exports.OperationalError = OperationalError;
