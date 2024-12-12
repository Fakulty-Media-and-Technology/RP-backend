"use strict";
const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');
const socketChat = require('./socket/socketEvents');
const { getActiveSessions, autoRenewSubscription, activateLiveStream, deActivateLiveStream, expireFeaturedContents, } = require('./cron');
const PORT = process.env.PORT || 8000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
});
global.io = io;
socketChat(io);
server.listen(PORT, async () => {
    console.log(`Node Server Listening on port: ${PORT} >>>>>> [http://localhost:${PORT}]`);
    // console.log(new Date("2024-09-20T15:00:00.000Z").getTime());
    // console.log(new Date("2024-09-25T15:00:00.000Z").getTime());
    // console.log(new Date(), new Date("2024-09-26T06:39:17.257+00:00"));
    //Cron Jobs
    getActiveSessions();
    autoRenewSubscription(); //1725572611210
    activateLiveStream(); //1725572685813
    deActivateLiveStream();
    expireFeaturedContents();
});
