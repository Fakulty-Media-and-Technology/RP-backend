"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const between = (value, min, max) => value >= min && value <= max;
const getMessagePrefixFromStatusCode = (statusCode) => {
    switch (true) {
        case between(statusCode, 200, 299):
            return 'Request Successful:';
        case between(statusCode, 400, 402):
            return '`Invalid Request:';
        case between(statusCode, 403, 499):
            return 'Request Failed:';
        case between(statusCode, 500, 600):
            return 'Server Error:';
        default:
            return ':';
    }
};
const sendResponse = (params) => {
    const { statusCode = 200, data = null, message = 'success', res } = params;
    res.status(statusCode).json({
        status: statusCode,
        message: getMessagePrefixFromStatusCode(statusCode) + ' ' + message,
        data,
    });
};
exports.sendResponse = sendResponse;
