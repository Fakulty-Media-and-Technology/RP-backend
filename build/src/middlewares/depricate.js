"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwDepricatedRoute = void 0;
const OperationalError_1 = require("../utils/OperationalError");
const throwDepricatedRoute = (_, __, next) => {
    return next(new OperationalError_1.OperationalError('This route is depricated', 400));
};
exports.throwDepricatedRoute = throwDepricatedRoute;
