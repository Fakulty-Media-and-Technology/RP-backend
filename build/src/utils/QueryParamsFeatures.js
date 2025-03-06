"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParamsFeatures = exports.skip = exports.handleDefaultNumAndUnknown = void 0;
const handleDefaultNumAndUnknown = (val, defaultNum) => {
    if (typeof val !== 'string') {
        return defaultNum;
    }
    const num = Number(val);
    return Number.isNaN(num) || num <= 0 ? defaultNum : num;
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
