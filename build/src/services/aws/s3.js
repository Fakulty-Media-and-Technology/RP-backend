"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
const lib_storage_1 = require("@aws-sdk/lib-storage");
const utils_1 = require("./utils");
const client_s3_1 = require("@aws-sdk/client-s3");
class S3 {
}
exports.S3 = S3;
_a = S3;
S3.upload = (params) => {
    return new lib_storage_1.Upload({ client: utils_1.AwsUtils.clients.s3, params }).done();
};
S3.deleteObject = async (key) => {
    const command = new client_s3_1.DeleteObjectCommand({
        Key: key,
        Bucket: utils_1.AwsUtils.buckets.s3Input,
    });
    const res = await utils_1.AwsUtils.clients.s3.send(command);
    return res;
};
