const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const socketChat = require("./socket/socketEvents");
const { getActiveSessions, autoRenewSubscription } = require("./cron");
const { connect } = require("./livestream/nms");
const connectDB = require("./app");

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

const io = new Server(server, {
     cors: "*",
     methods: ["GET", "POST", "PUT", "DELETE"],
});

global.io = io;

socketChat(io);

server.listen(PORT, async () => {
     console.log(
          `Node Server Listening on port: ${PORT} >>>>>> [http://localhost:${PORT}]`
     );

     await connectDB();

     await connect.register(app);
     console.log("rtmp server connected");

     //Cron Jobs
     getActiveSessions();
     autoRenewSubscription();
});
