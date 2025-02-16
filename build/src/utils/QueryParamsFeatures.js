"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParamsFeatures = exports.skip = exports.handleDefaultNumAndUnknown = void 0;
const OperationalError_1 = require("./OperationalError");
const handleDefaultNumAndUnknown = (val, defaultNum) => {
    if (typeof val !== 'string') {
        return defaultNum;
    }
    if (/^[0-9]+$/.test(val) === false) {
        return defaultNum;
    }
    const num = Number(val);
    if (num <= 0) {
        throw new OperationalError_1.OperationalError('pagination values cannot be less than or equal zero', 400);
    }
    return num;
};
exports.handleDefaultNumAndUnknown = handleDefaultNumAndUnknown;
const skip = (page, limit) => (page - 1) * limit;
exports.skip = skip;
class QueryParamsFeatures {
    constructor(query, options) {
        this.query = query;
        this._options = options;
    }
    paginate() {
        const { queryParams, defaultPage = 1, defaultLimit = 50 } = this._options;
        const page = (0, exports.handleDefaultNumAndUnknown)(queryParams.page, defaultPage);
        const limit = (0, exports.handleDefaultNumAndUnknown)(queryParams.limit, defaultLimit);
        this.query.skip((0, exports.skip)(page, limit)).limit(limit);
        return this;
    }
}
exports.QueryParamsFeatures = QueryParamsFeatures;
