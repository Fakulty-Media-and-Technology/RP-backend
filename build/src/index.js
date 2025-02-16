"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const node_http_1 = require("node:http");
const cron_1 = require("./cron");
const app_1 = require("./app");
const env_1 = __importDefault(require("./env"));
const Assets_1 = require("./utils/Assets");
const nms_1 = require("./livestream/nms");
const FileHandler_1 = require("./utils/FileHandler");
const connectDB_1 = require("./utils/connectDB");
const socketEvents_1 = require("./socket/socketEvents");
const purgeOldTempMediaFiles_1 = require("./utils/purgeOldTempMediaFiles");
const { PORT } = env_1.default;
const app = (0, app_1.reeplayApp)();
const server = (0, node_http_1.createServer)(app);
const cronJobs = new cron_1.CronTasks();
const mediaStream = new nms_1.MediaStream();
const io = new socket_io_1.Server(server, {
    cors: { origin: '*' },
});
const makeMediaDirectories = () => {
    Object.values(Assets_1.Assets.rootMediaDirs).forEach(dir => FileHandler_1.FileHandler.createDirIfNotExistSync(dir));
};
makeMediaDirectories();
(0, connectDB_1.connectMongoDB)().then(conn => {
    console.log(conn);
    server.listen(PORT, async () => {
        console.log(`Node Server Listening on port: ${PORT} >>>>>> [http://localhost:${PORT}]`);
        (0, socketEvents_1.socketChat)(io);
        cronJobs.start();
        mediaStream.initiate();
        setInterval(() => (0, purgeOldTempMediaFiles_1.purgeOldTempMediaFiles)(), 600000); // every ten minutes
    });
});
server.on('close', async () => {
    console.error('reeplay server is closed: ..... 😢😢......');
    process.exit();
});
// do not handle SIGKILL and SIGSTOP
process
    .on('uncaughtException', shutdown('uncaughtException'))
    .on('unhandledRejection', shutdown('unhandledRejection'));
function shutdown(exception) {
    return async (...args) => {
        setTimeout(() => process.exit(1), 400).unref();
        console.error('Server shutdown routine initiated for exception >>>> 🛑', exception);
        console.error('Reasons >>>> 🛑:', args.join(' | '));
        // *********** clean up
        io.close();
        console.log('IO Websocket closed');
        cronJobs.stop();
        mediaStream.close();
        await mongoose_1.default.connection.close(true);
        console.log('Mongoose connection closed');
        server.close();
    };
}
