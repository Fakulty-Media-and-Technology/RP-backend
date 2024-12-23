"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaAccess = exports.mediaConvertClient = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_mediaconvert_1 = require("@aws-sdk/client-mediaconvert");
const env_1 = __importDefault(require("../env"));
const s3ClientsConfig = {
    region: env_1.default.S3REGION,
    credentials: {
        accessKeyId: env_1.default.S3ACCESS_KEY,
        secretAccessKey: env_1.default.S3SECRET_KEY,
    },
};
exports.s3Client = new client_s3_1.S3Client(s3ClientsConfig);
exports.mediaConvertClient = new client_mediaconvert_1.MediaConvertClient(s3ClientsConfig);
// exports.readPhotos = async (bucket: string, key: string) => {
//   const params = {
//     Bucket: bucket,
//     Expires: 259200, //3*24*60*60
//     Key: key,
//   }
//   const command = new GetObjectCommand(params)
//   const signed = await getSignedUrl(s3Client, command)
//   return signed
// }
// exports.getVideoUrl = async (bucket: string, key: string) => {
//   const params = {
//     Bucket: bucket,
//     Expires: 36000,
//     Key: key,
//   }
//   const command = new GetObjectCommand(params)
//   const signed = await getSignedUrl(s3Client, command)
//   return signed
// }
class MediaAccess {
}
exports.MediaAccess = MediaAccess;
_a = MediaAccess;
MediaAccess.getSignedUrl = async (Bucket, Key, type) => {
    const expiresIn = type === 'video' ? 36000 : 259200;
    const command = new client_s3_1.GetObjectCommand({ Bucket, Key });
    const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn });
    return signedUrl;
};
