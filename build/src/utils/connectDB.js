"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = void 0;
const mongoose_1 = require("mongoose");
const env_1 = __importDefault(require("../env"));
const connectMongoDB = async (url = env_1.default.MONGO_DB_URL) => {
    if (mongoose_1.connection.readyState === 1) {
        return 'Already Connected to MongoDB';
    }
    await (0, mongoose_1.connect)(url);
    return 'Connected to mongoDB succesfully';
};
exports.connectMongoDB = connectMongoDB;
