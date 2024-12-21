"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const OperationalError_1 = require("../utils/OperationalError");
const responder_1 = require("../utils/responder");
class ErrorMiddleware {
}
exports.ErrorMiddleware = ErrorMiddleware;
ErrorMiddleware.allErrors = (err, _, res, __) => {
    if (err instanceof OperationalError_1.OperationalError) {
        (0, responder_1.sendResponse)({
            res,
            data: err,
            message: err.message,
            statusCode: err.statusCode,
        });
        return;
    }
    // this can be made very elaborate
    (0, responder_1.sendResponse)({
        res,
        message: 'something went wrong. Please try again',
        statusCode: 500,
    });
};
ErrorMiddleware.wildRoute = ({ method, originalUrl }, _, next) => {
    return next(new OperationalError_1.OperationalError(`${method.toUpperCase()} ${originalUrl} is not implemented on this server`, 501));
};
