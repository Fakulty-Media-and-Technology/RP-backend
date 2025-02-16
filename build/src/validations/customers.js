"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRatingSchema = exports.createRatingSchema = exports.updateCommentSchema = exports.createCommentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
exports.createCommentSchema = {
    body: joi_1.default.object({
        message: common_1.STRING_SCHEMA.required(),
        parentType: common_1.STRING_SCHEMA.valid('vod', 'episode').required(),
        parentId: common_1.MONGO_DB_OBJECT_ID_SCHEMA.required(),
    }),
};
exports.updateCommentSchema = {
    body: joi_1.default.object({
        message: common_1.STRING_SCHEMA.required(),
    }),
};
exports.createRatingSchema = {
    body: joi_1.default.object({
        parentType: common_1.STRING_SCHEMA.valid('vod', 'episode').required(),
        parentId: common_1.MONGO_DB_OBJECT_ID_SCHEMA.required(),
        rate: joi_1.default.number().min(0).max(5).required(),
        comment: common_1.STRING_SCHEMA.optional(),
    }),
};
exports.updateRatingSchema = {
    body: joi_1.default.object({
        comment: common_1.STRING_SCHEMA.optional(),
        rate: joi_1.default.number().min(0).max(5).optional(),
    }).or('comment', 'rate'),
};
