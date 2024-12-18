"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketChat = void 0;
const comments_model_1 = require("../models/comments.model");
const lives_model_1 = require("../models/lives.model");
const ls_auth_mw_1 = require("../middlewares/ls-auth.mw");
const getUserFromAuth = async (token) => {
    try {
        return await (0, ls_auth_mw_1.liveStreamAuth)(token);
    }
    catch (e) {
        // do somthing with the error
        return null;
    }
};
const socketChat = async (io) => {
    console.log('Sockets initited successfully');
    io.on('connection', async (socket) => {
        let rooms = [...socket.rooms];
        socket.on('livestream join', async (data) => {
            const { token, liveId } = data;
            const user = await getUserFromAuth(token);
            if (user == null) {
                // do something
                return;
            }
            const liveEvent = await lives_model_1.LiveModel.findOne({
                _id: liveId,
                active: true,
            });
            if (!liveEvent) {
                console.log('live event not exist or not active');
                return null;
            }
            const live_id = liveEvent.id;
            if (!rooms.includes(live_id)) {
                socket.join(live_id);
            }
            await lives_model_1.LiveModel.findOneAndUpdate({
                _id: live_id,
            }, {
                $inc: {
                    views: 1,
                    active_views: 1,
                },
            }, {
                upsert: true,
            });
            io.to(live_id).emit('user joins', {
                user_id: user.id,
                message: 'new user joined',
            });
        });
        socket.on('livestream comment', async (data) => {
            const { token, liveId, message } = data;
            const user = await getUserFromAuth(token);
            if (user == null) {
                // do something
                return;
            }
            const liveEvent = await lives_model_1.LiveModel.findOne({
                _id: liveId,
                active: true,
            });
            if (!liveEvent) {
                return null;
            }
            if (message.toString().length < 2) {
                return null;
            }
            const live_id = liveEvent.id;
            if (!rooms.includes(live_id)) {
                socket.join(live_id);
            }
            const nComment = new comments_model_1.CommentModel({
                customer_id: user._id,
                message: message,
                type: 'live',
            });
            const newComment = await nComment.save();
            io.to(live_id).emit('livestream comment', {
                message: newComment,
                room: live_id,
            });
        });
        socket.on('disconnect', async () => {
            // console.log(
            //   `user ${socket.userId} disconnected: ${reason}`,
            //   socket.id,
            //   socket.client.conn.server.clientsCount,
            // )
            // ! Find  a pay to associate liveId and userid to a socket
            // ! todo: user map
            // const userId = socket.userId as any
            // const live_id = socket.liveId
            // await LiveModel.findOneAndUpdate(
            //   {
            //     _id: live_id,
            //   },
            //   {
            //     $inc: {
            //       active_views: -1,
            //     },
            //   },
            //   {
            //     upsert: true,
            //   },
            // )
            // io.emit('disconnect', {
            //   user_id: userId,
            //   message: 'user left',
            // })
        });
    });
};
exports.socketChat = socketChat;
