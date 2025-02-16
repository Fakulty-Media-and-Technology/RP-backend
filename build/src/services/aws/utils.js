"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsUtils = void 0;
const client_mediaconvert_1 = require("@aws-sdk/client-mediaconvert");
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = __importDefault(require("../../env"));
const s3ClientsConfig = {
    region: env_1.default.S3REGION,
    credentials: {
        accessKeyId: env_1.default.S3ACCESS_KEY,
        secretAccessKey: env_1.default.S3SECRET_KEY,
    },
};
class AwsUtils {
}
exports.AwsUtils = AwsUtils;
AwsUtils.clients = {
    s3: new client_s3_1.S3Client(s3ClientsConfig),
    mediaConvert: new client_mediaconvert_1.MediaConvertClient(s3ClientsConfig),
};
AwsUtils.buckets = {
    reeplay: 'reeplay',
    get s3Input() {
        return `s3://${this.reeplay}/`;
    },
    get transcodeOutput() {
        return `s3://${this.reeplay}/transcode/`;
    },
};
