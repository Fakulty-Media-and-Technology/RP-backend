"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const node_http_1 = require("node:http");
const connectDB_1 = require("./utils/connectDB");
const socketEvents_1 = require("./socket/socketEvents");
const cron_1 = require("./cron");
const app_1 = require("./app");
const env_1 = __importDefault(require("./env"));
// import { nmsLivestream } from './livestream/nms'
const { PORT } = env_1.default;
const app = (0, app_1.reeplayApp)();
const server = (0, node_http_1.createServer)(app);
const cronJobs = new cron_1.CronTasks();
const io = new socket_io_1.Server(server, {
    cors: { origin: '*' },
});
(async () => {
    const mongoDBConnectionRes = await (0, connectDB_1.connectMongoDB)();
    console.log(mongoDBConnectionRes);
    server.listen(PORT, async () => {
        console.log(`Node Server Listening on port: ${PORT} >>>>>> [http://localhost:${PORT}]`);
        (0, socketEvents_1.socketChat)(io);
        cronJobs.start();
    });
})();
