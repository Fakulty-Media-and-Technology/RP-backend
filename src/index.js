const http = require("http");
const app = require("./app");
const socketChat = require("./socket/socketEvents");
const { Server } = require("socket.io");

const PORT = process.env.PORT;

const server = http.createServer(app);

const io = new Server(server, {
    cors: "*",
    methods: ["GET", "POST",],
})

global.io = io;

socketChat(io)

server.listen(PORT, () => {
    console.log(
        `Node Server Listening on port: ${PORT} \n [http://localhost:${PORT}]`
    );
});

module.exports = server;
