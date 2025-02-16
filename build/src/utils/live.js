"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signCred = exports.calcLiveCharges = exports.getUniqueStreamKey = void 0;
const env_1 = __importDefault(require("../env"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const lives_model_1 = require("../models/lives.model");
const OperationalError_1 = require("./OperationalError");
const strGen_1 = require("./strGen");
const getUniqueStreamKey = async (triesCount = 1) => {
    if (triesCount >= 5) {
        throw new OperationalError_1.OperationalError('Please try again', 500);
    }
    const streamId = (0, strGen_1.genRandUniqId)(12);
    const streamIdExist = await lives_model_1.LiveModel.findOne({
        stream_key: streamId,
    });
    if (streamIdExist) {
        return await (0, exports.getUniqueStreamKey)(++triesCount);
    }
    return streamId;
};
exports.getUniqueStreamKey = getUniqueStreamKey;
const calcLiveCharges = (start, expiry) => {
    const startDate = new Date(start).getTime();
    const expiryDate = new Date(expiry).getTime();
    const hoursDifference = (expiryDate - startDate) / (60 * 60000);
    return hoursDifference * env_1.default.EVENT_HOURLY_CHARGES;
};
exports.calcLiveCharges = calcLiveCharges;
const signCred = (streamKey, expiryDate) => {
    const dateStamp = Math.ceil(expiryDate.getTime() / 1000);
    const hash = node_crypto_1.default
        .createHash('md5')
        .update(`/${env_1.default.RP_RTMP_APP_NAME}/${streamKey}-${dateStamp}-${env_1.default.RP_RMTP_AUTH_SECRET}`)
        .digest('hex');
    return `${dateStamp}-${hash}`;
};
exports.signCred = signCred;
