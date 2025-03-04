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
const strGen_1 = require("./strGen");
class Multer {
}
exports.Multer = Multer;
_a = Multer;
Multer._diskStorageConfig = multer_1.default.diskStorage({
    destination: Assets_1.Assets.rootMediaDirs.multer,
    filename: (_, file, cb) => {
        cb(null, (0, strGen_1.genRandUniqId)(5) + '_' + file.originalname);
    },
});
Multer._configs = {
    multipleTypesConfig: (0, multer_1.default)({ storage: _a._diskStorageConfig }),
    vidConfig: (0, multer_1.default)({
        storage: _a._diskStorageConfig,
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
        fileFilter: (_, __, cb) => {
            // if (!file.mimetype.startsWith('text')) {
            //   cb(new OperationalError('Only text file is allowed', 400))
            //   return
            // }
            cb(null, true);
        },
    }),
};
Multer.uploadSingleImage = _a._configs.imageConfig.single('photo');
Multer.uploadSingleVideo = _a._configs.vidConfig.single('video');
Multer.uploadSingleSubtitle = _a._configs.subtitleConfig.single('subtitle');
Multer.adminUploadVideoConfig = _a._configs.multipleTypesConfig.fields([
    { name: 'trailer', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'landscapePoster', maxCount: 1 },
    { name: 'portraitPoster', maxCount: 1 },
]);
Multer.adminUploadSeasonConfig = _a._configs.multipleTypesConfig.fields([
    { name: 'trailer', maxCount: 1 },
    { name: 'portraitPhoto', maxCount: 1 },
    { name: 'landscapePhoto', maxCount: 1 },
]);
Multer.createLiveConfig = _a._configs.multipleTypesConfig.fields([
    { name: 'previewVideo', maxCount: 1 },
    { name: 'coverPhoto', maxCount: 1 },
]);
Multer.createUpcomingConfig = _a._configs.multipleTypesConfig.fields([
    { name: 'portraitPhoto', maxCount: 1 },
    { name: 'landscapePhoto', maxCount: 1 },
    { name: 'trailer', maxCount: 1 },
]);
