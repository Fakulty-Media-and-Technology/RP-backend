"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaAccess = void 0;
const moment_1 = __importDefault(require("moment"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const cloudfront_signer_1 = require("@aws-sdk/cloudfront-signer");
const utils_1 = require("./aws/utils");
const env_1 = __importDefault(require("../env"));
class MediaAccess {
}
exports.MediaAccess = MediaAccess;
_a = MediaAccess;
MediaAccess.getSignedUrl = async (Bucket, Key, type) => {
    const command = new client_s3_1.GetObjectCommand({ Bucket, Key });
    return await (0, s3_request_presigner_1.getSignedUrl)(utils_1.AwsUtils.clients.s3, command, {
        expiresIn: type == 'subtitle' ? 250900 : 300000,
    });
};
MediaAccess.getCloudFrontSignedUrl = (key) => {
    const privateKey = env_1.default.CFS_PRIVATE_KEY.replace(/\\n/g, '\n');
    return (0, cloudfront_signer_1.getSignedUrl)({
        url: env_1.default.CFSDISTRIBUTION + '/' + key,
        keyPairId: env_1.default.KEY_PAIR_ID,
        dateLessThan: (0, moment_1.default)().add(3, 'days').toISOString(),
        privateKey,
    });
};
