const liveStreamAuth = require("../middlewares/ls-auth.mw");
const CommentsModel = require("../models/comments.model");
const LivesModel = require("../models/lives.model");

const socketChat = async (io) => {
    io.on("connection", async (socket) => {
        // const { token, name } = socket.handshake.query;

        // const reslt = await socketAuth(token);
        // console.log(reslt);
        // if (reslt === null) {
        //     console.log("validation error");
        // }

        let rooms = [...socket.rooms];

        // console.log(
        //     "user connected",
        //     socket.id,
        //     socket.client.conn.server.clientsCount
        // );

        socket.on("livestream join", async (data) => {
            const { token, liveId } = data;

            let user = await liveStreamAuth(token);

            socket.userId = user?._id;
            socket.liveId = liveId;

            const userid = socket?.userId;

            const liveEvent = await LivesModel.findOne({
                _id: liveId,
                active: true
            });

            if(!liveEvent) {
                console.log("live event not exist or not active")
                return null
            }

            const live_id = liveEvent._id.toString()

            if(!rooms.includes(live_id)){
                socket.join(live_id);
            }

            await LivesModel.findOneAndUpdate(
                {
                    _id: live_id
                },
                {
                    $inc: {
                        views: 1,
                        active_views: 1
                    }
                },
                {
                    upsert: true
                }
            );
            
            io.to(live_id).emit("user joins", { user_id: userid, message: 'new user joined' });
        });

        socket.on("livestream comment", async (data) => {
            const { token, liveId, message } = data;

            let user = await liveStreamAuth(token);

            const liveEvent = await LivesModel.findOne({
                _id: liveId,
                active: true
            });

            if (!liveEvent) {
                return null;
            }

            if (message.toString().length < 2) {
                return null;
            }

            const live_id = liveEvent._id.toString()

            if (!rooms.includes(live_id)) {
                socket.join(live_id);
            }

            const nComment = new CommentsModel({
                customer_id: user._id,
                message: message,
                type: "live"
            })

            const newComment = await nComment.save();

            io.to(live_id).emit("livestream comment", {
                message: newComment,
                room: roomExist,
            });
        });

        // socket.on("livestream typing", async (data) => {
        //     const {  } = data;

        //     io.to(live_id).emit("livestream typing", data);
        // });

        socket.on("disconnect", async (reason) => {
            console.log(
                `user ${socket.userId} disconnected: ${reason}`,
                socket.id,
                socket.client.conn.server.clientsCount
            );

            const userId = socket.userId;
            const live_id = socket.liveId;

            await LivesModel.findOneAndUpdate(
                {
                    _id: live_id
                },
                {
                    $inc: {
                        active_views: -1
                    }
                },
                {
                    upsert: true
                }
            );

            io.to().emit("disconnect", { user_id: userId, message: 'user left' });
        });
    });
};

module.exports = socketChat;