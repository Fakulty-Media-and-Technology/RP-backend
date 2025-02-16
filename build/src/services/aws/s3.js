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
S3.deleteObject = async (Key, Bucket = utils_1.AwsUtils.buckets.reeplay) => {
    const command = new client_s3_1.DeleteObjectCommand({ Key, Bucket });
    const res = await utils_1.AwsUtils.clients.s3.send(command);
    return res;
};
S3.getTranscodedKeysFromInputKey = async (inputKey) => {
    const command = new client_s3_1.ListObjectsCommand({
        Bucket: utils_1.AwsUtils.buckets.reeplay,
        Prefix: inputKey.replace('videos', 'transcode'),
    });
    const res = await utils_1.AwsUtils.clients.s3.send(command);
    if (!res.Contents)
        return [];
    const outputKeys = res.Contents.reduce((acc, content) => {
        content.Key ? acc.push(content.Key) : acc;
        return acc;
    }, []);
    return outputKeys;
};
S3.setResolutionsPairs = async (inputKey) => {
    const keys = await _a.getTranscodedKeysFromInputKey(inputKey);
    const pairs = keys.map(key => {
        let resolution = '';
        switch (true) {
            case key.includes('_1080p'):
                resolution = '1080';
                break;
            case key.includes('_480p'):
                resolution = '480';
                break;
            default:
                resolution = '720';
                break;
        }
        return { key, resolution };
    });
    return pairs;
};
