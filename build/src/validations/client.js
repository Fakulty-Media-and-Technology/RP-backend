"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
exports.updateProfileSchema = {
    body: joi_1.default.object({
        first_name: common_1.STRING_SCHEMA,
        last_name: common_1.STRING_SCHEMA,
        country_code: common_1.STRING_SCHEMA,
        mobile: common_1.STRING_SCHEMA,
        photo: common_1.PHOTO_SCHEMA_WITH_CONTENT_TYPE,
    }),
};
