"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const OperationalError_1 = require("../utils/OperationalError");
const responder_1 = require("../utils/responder");
class ErrorMiddleware {
}
exports.ErrorMiddleware = ErrorMiddleware;
ErrorMiddleware.allErrors = (error, _, res, __) => {
    switch (error.name) {
        case 'TokenExpiredError':
            error = new OperationalError_1.OperationalError('Expired session. Please login', 401);
            break;
        case 'JsonWebTokenError':
            error = new OperationalError_1.OperationalError('Invalid credentials. Please login', 401);
            break;
        case 'MongooseError':
            error = new OperationalError_1.OperationalError('Network Error', 502);
            break;
        case 'MongoNetworkTimeoutError':
            error = new OperationalError_1.OperationalError('Database Connection error', 502);
            break;
        case 'MongoServerError':
            if (error.code === 11000) {
                const entries = Object.entries(error.keyValue);
                let keyValues = '';
                entries.forEach(([key, value], index) => {
                    const keyValueStr = `${key} : ${value}`;
                    keyValues += index === entries.length - 1 ? keyValueStr : keyValueStr + ' AND ';
                });
                const message = `<${keyValues}> ${entries.length === 1 ? 'is' : 'are'} associated with another document in the table.`;
                error = new OperationalError_1.OperationalError(message, 400);
                break;
            }
            console.log(error.name, error.message);
            break;
        default:
            error = new OperationalError_1.OperationalError(error.message || 'Unkown application error', error.statusCode || 500);
            break;
    }
    const isOperationalError = error instanceof OperationalError_1.OperationalError;
    const message = isOperationalError ? error.message : 'something went wrong please try again';
    const statusCode = isOperationalError ? error.statusCode : 500;
    (0, responder_1.sendResponse)({
        res,
        message,
        statusCode,
    });
    !isOperationalError && console.log('Express Error middleware Middleware🛑', error);
};
ErrorMiddleware.wildRoute = ({ method, originalUrl }, _, next) => {
    return next(new OperationalError_1.OperationalError(`${method.toUpperCase()} ${originalUrl} is not implemented on this server`, 501));
};
