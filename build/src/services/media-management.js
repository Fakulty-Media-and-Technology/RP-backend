"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaManagement = void 0;
const node_fs_1 = require("node:fs");
const node_stream_1 = require("node:stream");
const node_crypto_1 = __importDefault(require("node:crypto"));
const OperationalError_1 = require("../utils/OperationalError");
const s3_1 = require("./aws/s3");
const utils_1 = require("./aws/utils");
const Bytes_1 = require("../utils/Bytes");
const rimraf_1 = require("rimraf");
const mediaConvert_1 = require("./aws/mediaConvert");
class MediaManagement {
}
exports.MediaManagement = MediaManagement;
_a = MediaManagement;
MediaManagement._genUniqueKey = () => Date.now() + '-' + node_crypto_1.default.randomBytes(5).toString('hex');
MediaManagement._deleteFile = async (file) => {
    if (file.path == null)
        return;
    try {
        await (0, rimraf_1.rimraf)(file.path);
    }
    catch {
        console.error('🛑 error deleting ', +file.filename, 'after upload');
    }
};
MediaManagement.uploadAndInitiateMediaConvert = async ({ file, expire }) => {
    const video = await _a.store({
        file,
        expire: typeof expire === 'string' ? new Date(expire) : undefined,
        baseDir: 'videos',
    });
    await mediaConvert_1.MediaConvert.transcode(video.Key);
    return {
        ...video,
        isTranscoded: false,
    };
};
MediaManagement.store = async ({ file, expire, baseDir }) => {
    let Body;
    if (file.buffer) {
        Body = file.buffer;
    }
    else if (file.path) {
        const passThrough = new node_stream_1.PassThrough();
        (0, node_fs_1.createReadStream)(file.path, { highWaterMark: Bytes_1.Bytes.mb(100) }).pipe(passThrough);
        Body = passThrough;
    }
    else {
        throw new OperationalError_1.OperationalError('file is improperly formatted', 500);
    }
    const uploadRes = await s3_1.S3.upload({
        Body,
        Bucket: utils_1.AwsUtils.buckets.reeplay,
        Key: `${baseDir}/${_a._genUniqueKey()}`,
        ContentType: file.mimetype,
        Expires: expire,
    });
    await _a._deleteFile(file);
    if (uploadRes.$metadata.httpStatusCode !== 200 || !uploadRes.Key) {
        throw new OperationalError_1.OperationalError('could not upload video. Please try again', 500);
    }
    return {
        Bucket: uploadRes.Bucket,
        Key: uploadRes.Key,
        mimetype: file.mimetype,
        size: file.size,
    };
};
MediaManagement.deleteObject = async (key, bucket) => {
    const response = await s3_1.S3.deleteObject(key, bucket);
    const deleted = response.$metadata.httpStatusCode === 200;
    if (!deleted)
        console.error(`🛑🛑 S3 Object delete error. KEY: ${key} | BUCKET: ${bucket}`);
    return deleted;
};
