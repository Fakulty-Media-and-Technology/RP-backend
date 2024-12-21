"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Multer = void 0;
const multer_1 = __importDefault(require("multer"));
const Bytes_1 = require("./Bytes");
const OperationalError_1 = require("./OperationalError");
const Assets_1 = require("./Assets");
class Multer {
}
exports.Multer = Multer;
_a = Multer;
Multer._configs = {
    videConfig: (0, multer_1.default)({
        storage: multer_1.default.diskStorage({
            destination: Assets_1.Assets.rootMediaDirs.multer,
            filename: (_, file, cb) => {
                cb(null, file.originalname);
            },
        }),
        limits: { fieldSize: Bytes_1.Bytes.gb(20) },
        fileFilter: (_, file, cb) => {
            if (!file.mimetype.startsWith('video')) {
                cb(new OperationalError_1.OperationalError('Only video file is allowed', 400));
                return;
            }
            cb(null, true);
        },
    }),
    imageConfig: (0, multer_1.default)({
        storage: multer_1.default.memoryStorage(),
        fileFilter: (_, file, cb) => {
            if (!file.mimetype.startsWith('image')) {
                cb(new OperationalError_1.OperationalError('Only image file is allowed', 400));
                return;
            }
            cb(null, true);
        },
    }),
    subtitleConfig: (0, multer_1.default)({
        storage: multer_1.default.memoryStorage(),
    }),
};
Multer.uploadSingleImage = _a._configs.imageConfig.single('photo');
Multer.uploadSingleVideo = _a._configs.videConfig.single('video');
Multer.uploadSingleSubtitle = _a._configs.subtitleConfig.single('subtitle');
