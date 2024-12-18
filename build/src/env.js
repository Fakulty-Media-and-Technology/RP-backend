"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const getValidEnv = (variables) => {
    Object.entries(variables).forEach(([key, val]) => {
        if (val === undefined) {
            throw new Error(`${key} is missing from env file`);
        }
    });
    return variables;
};
exports.env = getValidEnv({
    PORT: process.env.PORT,
    MONGO_DB_URL: process.env.MONGO_DB_URL,
    // ??
    MEDIA_SERVER_PORT: Number(process.env.MEDIA_SERVER_PORT || 8888),
    EVENT_HOURLY_CHARGES: process.env.EVENT_HOURLY_CHARGES,
    // payments
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    // livestream
    RP_HLSURL: process.env.RP_HLSURL,
    RP_RTMPURL: process.env.RP_RTMPURL,
    // emails
    MAIL_SENDER: process.env.MAIL_SENDER,
    MAILTRAP_USER: process.env.MAILTRAP_USER,
    MAILTRAP_PASS: process.env.MAILTRAP_PASS,
    //   secrets
    JWT_SECRET: process.env.JWT_SECRET,
    GUEST_TOKEN: process.env.GUEST_TOKEN,
    JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN,
    // AWS S3
    S3REGION: process.env.S3REGION,
    S3SECRET_KEY: process.env.S3SECRET_KEY,
    S3ACCESS_KEY: process.env.S3ACCESS_KEY,
    // media
    KEY_PAIR_ID: process.env.KEY_PAIR_ID,
    CFS_PRIVATE_KEY: process.env.CFS_PRIVATE_KEY,
    // *** new
    MIN_WITHDRAWAL_AMOUNT: Number(process.env.MIN_WITHDRAWAL_AMOUNT ?? 50000),
    WITHDRAWAL_PERCENT: Number(process.env.WITHDRAWAL_PERCENT ?? 15),
});
exports.default = exports.env;
