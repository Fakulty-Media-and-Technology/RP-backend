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
        return null;
    }
};
const socketChat = async (io) => {
    console.log('Sockets initited successfully');
    io.on('connection', async (socket) => {
        // let rooms = [...socket.rooms]
        socket.on('joinLivestream', async (data) => {
            const { token, liveId } = data;
            const user = await getUserFromAuth(token);
            if (user == null)
                return;
            const liveEvent = await lives_model_1.LiveModel.findOne({
                _id: liveId,
                active: true,
            });
            if (!liveEvent)
                return null;
            // if (!rooms.includes(liveId)) {
            //   socket.join(live_id)
            // }
            socket.join(liveId);
            await lives_model_1.LiveModel.findByIdAndUpdate(liveId, {
                $inc: {
                    active_views: 1,
                },
                $addToSet: { views: user },
            });
            io.to(liveId).emit('joinedRoom', {
                user_id: user.id,
                message: 'new user joined',
            });
            socket.on('disconnect', async () => {
                await lives_model_1.LiveModel.findByIdAndUpdate(liveId, {
                    $inc: {
                        active_views: -1,
                    },
                });
                io.to(liveId).emit('leftRoom', {
                    user_id: user.id,
                    message: 'user left',
                });
            });
        });
        socket.on('livestreamComment', async (data) => {
            const { token, liveId, message } = data;
            const user = await getUserFromAuth(token);
            if (user == null)
                return;
            const liveEvent = await lives_model_1.LiveModel.findOne({
                _id: liveId,
                active: true,
            });
            if (!liveEvent || message.toString().length < 2)
                return null;
            socket.join(liveId);
            const newComment = await comments_model_1.CommentModel.create({
                userId: user._id,
                message: message,
                parentType: 'live',
                parentId: liveId,
            });
            io.to(liveId).emit('livestreamComment', {
                message: newComment,
                room: liveId,
            });
        });
    });
};
exports.socketChat = socketChat;
