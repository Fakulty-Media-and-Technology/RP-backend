"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMongoDBSession = exports.abortSession = exports.commitSession = exports.startTransaction = void 0;
const mongoose_1 = require("mongoose");
const env_1 = __importDefault(require("../env"));
const startTransaction = async () => {
    const session = await (0, mongoose_1.startSession)();
    session.startTransaction();
    return session;
};
exports.startTransaction = startTransaction;
const commitSession = async (session) => {
    if (session) {
        await session.commitTransaction();
        await session.endSession();
    }
};
exports.commitSession = commitSession;
const abortSession = async (session) => {
    if (session) {
        await session.abortTransaction();
        await session.endSession();
    }
};
exports.abortSession = abortSession;
const withMongoDBSession = async (runner, params) => {
    // local mongodb server throws errors with sessions because it lacks a local replica set, a problem that is very involved to solve
    let session = undefined;
    try {
        session = env_1.default.IS_PROD ? await (0, exports.startTransaction)() : undefined;
        const res = await runner(params, session);
        await (0, exports.commitSession)(session);
        return res;
    }
    catch (e) {
        await (0, exports.abortSession)(session);
        throw e;
    }
};
exports.withMongoDBSession = withMongoDBSession;
