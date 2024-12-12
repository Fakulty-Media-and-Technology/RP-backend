"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const express_1 = __importDefault(require("express"));
const connectDB_1 = require("./utils/connectDB");
const port = 5050;
(async () => {
    const mongoDBConnectionRes = await (0, connectDB_1.connectMongoDB)();
    console.log(mongoDBConnectionRes);
    const server = (0, node_http_1.createServer)((0, express_1.default)());
    server.listen(port, () => {
        console.log(`Server is listening oo port ${port}`);
    });
})();
