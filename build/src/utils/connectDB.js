"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = void 0;
const mongoose_1 = require("mongoose");
const connectMongoDB = async (url = 'mongodb://localhost:27017/reeplayDB') => {
    if (mongoose_1.connection.readyState === 1) {
        return 'Already Connected to MongoDB';
    }
    await (0, mongoose_1.connect)(url);
    return 'Connected to mongoDB succesfully';
};
exports.connectMongoDB = connectMongoDB;
