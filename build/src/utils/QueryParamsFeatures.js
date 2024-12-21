"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryParamsFeatures = exports.handleDefaultNumAndUnknown = void 0;
const handleDefaultNumAndUnknown = (val, defaultNum) => {
    if (typeof val !== 'string') {
        return defaultNum;
    }
    if (/^[0-9]+$/.test(val) === false) {
        return defaultNum;
    }
    // value is numeric here
    return Number(val);
};
exports.handleDefaultNumAndUnknown = handleDefaultNumAndUnknown;
class QueryParamsFeatures {
    constructor(query, options) {
        this.query = query;
        this._options = options;
    }
    _setNumDefaultNum(val, defaultNum) {
        return (0, exports.handleDefaultNumAndUnknown)(val, defaultNum);
    }
    paginate() {
        const { queryParams, defaultPage = 1, defaultLimit = 50 } = this._options;
        const page = this._setNumDefaultNum(queryParams.page, defaultPage);
        const limit = this._setNumDefaultNum(queryParams.limit, defaultLimit);
        const skip = (page - 1) * limit;
        this.query.skip(skip).limit(limit);
        return this;
    }
}
exports.QueryParamsFeatures = QueryParamsFeatures;
