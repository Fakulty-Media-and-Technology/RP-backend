"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIDEO_CLASS_SCHEMA = exports.ISO_STRING_SCHEMA = exports.LIVE_TYPE_SCHEMA = exports.POSTER_SCHEMA = exports.PHOTO_SCHEMA = exports.PHOTO_SCHEMA_WITH_CONTENT_TYPE = exports.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA = exports.MONGO_DB_OBJECT_ID_SCHEMA = exports.STRING_SCHEMA = exports.FLOATS_REG = exports.NUMERIC_REG = exports.MONGO_DB_OBJECT_ID_REG = void 0;
const joi_1 = __importDefault(require("joi"));
exports.MONGO_DB_OBJECT_ID_REG = /^[0-9A-Fa-f]{24}$/;
exports.NUMERIC_REG = /^\d+$/;
exports.FLOATS_REG = /[-+]?[0-9]*\.?[0-9]+/;
exports.STRING_SCHEMA = joi_1.default.string();
exports.MONGO_DB_OBJECT_ID_SCHEMA = joi_1.default.string().pattern(exports.MONGO_DB_OBJECT_ID_REG);
exports.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA = joi_1.default.array().items(exports.MONGO_DB_OBJECT_ID_SCHEMA);
exports.PHOTO_SCHEMA_WITH_CONTENT_TYPE = joi_1.default.object({
    Bucket: exports.STRING_SCHEMA.required(),
    Key: exports.STRING_SCHEMA.required(),
    ContentType: exports.STRING_SCHEMA.required(),
});
exports.PHOTO_SCHEMA = joi_1.default.object({
    Bucket: exports.STRING_SCHEMA.required(),
    Key: exports.STRING_SCHEMA.required(),
});
exports.POSTER_SCHEMA = joi_1.default.object({
    bucket: exports.STRING_SCHEMA.required(),
    key: exports.STRING_SCHEMA.required(),
    dimension: exports.STRING_SCHEMA.valid('landscape', 'portrait').required(),
});
exports.LIVE_TYPE_SCHEMA = exports.STRING_SCHEMA.valid('channel', 'event', 'tvshow', 'podcast', 'sport');
exports.ISO_STRING_SCHEMA = exports.STRING_SCHEMA.isoDate();
exports.VIDEO_CLASS_SCHEMA = exports.STRING_SCHEMA.valid('free', 'ad', 'exclusive', 'premium');
