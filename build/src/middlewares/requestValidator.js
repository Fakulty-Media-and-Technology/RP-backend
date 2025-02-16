"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.requestValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const Catch_1 = require("../utils/Catch");
const OperationalError_1 = require("../utils/OperationalError");
const pickObject = (obj, keys) => {
    const hasOwn = Object.prototype.hasOwnProperty.bind(obj);
    const picked = {};
    for (const key of keys) {
        if (hasOwn(key)) {
            picked[key] = obj[key];
        }
    }
    return picked;
};
const requestValidator = (schema) => Catch_1.Catch.sync((req, _, next) => {
    const validSchema = pickObject(schema, ['body', 'params', 'query']);
    const pickedReq = pickObject(req, Object.keys(validSchema));
    try {
        (0, exports.validate)(joi_1.default.compile(validSchema), pickedReq);
    }
    catch (e) {
        return next(e);
    }
    next();
});
exports.requestValidator = requestValidator;
const validate = (schema, object) => {
    const { error, value } = schema.validate(object);
    if (error) {
        throw new OperationalError_1.OperationalError(error.details.map(detail => detail.message).join(' '), 400);
    }
    return value;
};
exports.validate = validate;
