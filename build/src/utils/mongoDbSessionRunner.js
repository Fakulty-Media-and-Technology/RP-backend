"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMongoDBSession = exports.abortTransactionCleanly = exports.commitTransactionCleanly = exports.startTransaction = void 0;
const mongoose_1 = require("mongoose");
const startTransaction = async () => {
    const session = await (0, mongoose_1.startSession)();
    session.startTransaction();
    return session;
};
exports.startTransaction = startTransaction;
const commitTransactionCleanly = async (session) => {
    await session.commitTransaction();
    await session.endSession();
};
exports.commitTransactionCleanly = commitTransactionCleanly;
const abortTransactionCleanly = async (session) => {
    await session.abortTransaction();
    await session.endSession();
};
exports.abortTransactionCleanly = abortTransactionCleanly;
const withMongoDBSession = async (runner, params) => {
    let session = null;
    try {
        session = await (0, exports.startTransaction)();
        const res = await runner(params, session);
        await (0, exports.commitTransactionCleanly)(session);
        return res;
    }
    catch (e) {
        if (session) {
            await (0, exports.abortTransactionCleanly)(session);
        }
        throw e;
    }
};
exports.withMongoDBSession = withMongoDBSession;
