// import socketAuth from "../middlewares/socket.auth.js";
// import MessageModel from "../models/message.model.js";
// import RoomsModel from "../models/rooms.model.js";
// import UsersModel from "../models/users.model.js";

const socketChat = async (io) => {
    io.on("connection", async (socket) => {
        const { token, name } = socket.handshake.query;

        const reslt = await socketAuth(token);
        console.log(reslt);
        if (reslt === null) {
            console.log("validation error");
        }
        let rooms = [...socket.rooms];

        console.log(
            "user connected",
            socket.id,
            socket.client.conn.server.clientsCount
        );

        // socket.on("user connected", async ({ token }) => {
        //     let userId = await socketAuth(token);

        //     socket.userId = userId?.data?._id;

        //     const userid = socket?.userId;

        //     await UsersModel.findOneAndUpdate(
        //         {
        //             _id: userid,
        //         },
        //         {
        //             online: true,
        //         },
        //         {
        //             upsert: true,
        //         }
        //     );

        //     const userRooms = await RoomsModel.aggregate([
        //         {
        //             $match: {
        //                 $expr: {
        //                     $or: [
        //                         {
        //                             $eq: [
        //                                 "$sender_id",
        //                                 {
        //                                     $toObjectId: userid,
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             $eq: [
        //                                 "$receiver_id",
        //                                 {
        //                                     $toObjectId: userid,
        //                                 },
        //                             ],
        //                         },
        //                     ],
        //                 },
        //             },
        //         },
        //         {
        //             $project: {
        //                 room_id: 1,
        //             },
        //         },
        //     ]);

        //     for (let roomId of userRooms) {
        //         socket.join(roomId.room_id);
        //     }

        //     io.emit("user online status", { userid, online: true });
        //     console.log("logged-in user rooms", [...socket.rooms]);
        // });

        // socket.on("new room", async (data) => {
        //     const { sender_id, receiver_id, message } = data;

        //     const room1 = `private-${sender_id}-${receiver_id}`;

        //     const room2 = `private-${receiver_id}-${sender_id}`;

        //     const check1 = await UsersModel.aggregate([
        //         {
        //             $match: {
        //                 $expr: {
        //                     $and: {
        //                         $eq: ["$_id", sender_id],
        //                         $in: [
        //                             {
        //                                 $toString: receiver_id,
        //                             },
        //                             "$block_list",
        //                         ],
        //                     },
        //                 },
        //             },
        //         },
        //     ]);

        //     const check2 = await UsersModel.aggregate([
        //         {
        //             $match: {
        //                 $expr: {
        //                     $and: {
        //                         $eq: ["$_id", receiver_id],
        //                         $in: [
        //                             {
        //                                 $toString: sender_id,
        //                             },
        //                             "$block_list",
        //                         ],
        //                     },
        //                 },
        //             },
        //         },
        //     ]);

        //     if (check1 || check2) {
        //         console.log("blocked user, you cannot communicate");
        //         return null;
        //     }

        //     const roomExist = await RoomsModel.aggregate([
        //         {
        //             $match: {
        //                 $expr: {
        //                     $or: [
        //                         {
        //                             $eq: ["$room_id", room1],
        //                         },
        //                         {
        //                             $eq: ["$room_id", room2],
        //                         },
        //                     ],
        //                 },
        //             },
        //         },
        //     ]);

        //     if (
        //         roomExist[0]?.room_id === room1 ||
        //         roomExist[0]?.room_id === room2
        //     ) {
        //         console.log("room already exist");
        //         return null;
        //     }

        //     const newRoomDb = new RoomsModel({
        //         room_id: room1,
        //         sender_id: sender_id,
        //         receiver_id: receiver_id,
        //     });

        //     let newRoom = await newRoomDb.save();

        //     if (!rooms.includes(newRoom.room_id)) {
        //         socket.join(newRoom.room_id);
        //     }

        //     const nMessage = new MessageModel({
        //         room_id: newRoom.room_id,
        //         sender_id: sender_id,
        //         message: message,
        //         message_type: "text",
        //     });

        //     await nMessage.save();

        //     io.to(newRoom.room_id).emit("new room", {
        //         room: newRoom,
        //         message: "new chat initiated",
        //     });
        // });

        // socket.on("new message", async (data) => {
        //     const { sender_id, receiver_id, room_id, message, message_type } =
        //         data;

        //     const chatroom = room_id;

        //     let roomExist = await RoomsModel.findOne({
        //         room_id: chatroom,
        //     });

        //     if (message.toString().length < 3) {
        //         return null;
        //     }

        //     if (!roomExist || roomExist.room_id !== chatroom) {
        //         return null;
        //     }

        //     const check1 = await UsersModel.aggregate([
        //         {
        //             $match: {
        //                 $expr: {
        //                     $and: {
        //                         $eq: ["$_id", sender_id],
        //                         $in: [
        //                             {
        //                                 $toString: receiver_id,
        //                             },
        //                             "$block_list",
        //                         ],
        //                     },
        //                 },
        //             },
        //         },
        //     ]);

        //     const check2 = await UsersModel.aggregate([
        //         {
        //             $match: {
        //                 $expr: {
        //                     $and: {
        //                         $eq: ["$_id", receiver_id],
        //                         $in: [
        //                             {
        //                                 $toString: sender_id,
        //                             },
        //                             "$block_list",
        //                         ],
        //                     },
        //                 },
        //             },
        //         },
        //     ]);

        //     if (check1 || check2) {
        //         console.log("blocked user, you cannot communicate");
        //         return null;
        //     }

        //     if (!rooms.includes(roomExist.room_id)) {
        //         socket.join(roomExist.room_id);
        //     }

        //     const nMessage = new MessageModel({
        //         room_id: roomExist.room_id,
        //         sender_id: sender_id,
        //         message: message,
        //         message_type: "text",
        //     });

        //     const newMessage = await nMessage.save();

        //     // socket.to(roomExist.room_id).emit("new message", {
        //     //     message: newMessage,
        //     //     room: roomExist,
        //     // });

        //     // socket.broadcast.to(roomExist.room_id).emit("new message", {
        //     //     message: newMessage,
        //     //     room: roomExist,
        //     // });
        //     io.to(roomExist.room_id).emit("new message", {
        //         message: newMessage,
        //         room: roomExist,
        //     });
        // });

        // socket.on("seen status", async (data) => {
        //     const { time_seen, user_id, room_id } = data;

        //     const filter = {
        //         sender_id: {
        //             $ne: user_id,
        //         },
        //         room_id: room_id,
        //         seen_status: false,
        //         createdAt: {
        //             $lte: new Date(time_seen),
        //         },
        //     };

        //     const update = {
        //         $set: {
        //             seen_status: true,
        //         },
        //     };

        //     await MessageModel.updateMany(filter, update);

        //     io.to(room_id).emit("seen status", data);
        // });

        // socket.on("disconnect", async (reason) => {
        //     console.log(
        //         `user disconnected: ${reason}`,
        //         socket.id,
        //         socket.client.conn.server.clientsCount
        //     );

        //     const userId = socket.userId;

        //     await UsersModel.findOneAndUpdate(
        //         {
        //             _id: userId,
        //         },
        //         {
        //             online: false,
        //         },
        //         {
        //             upsert: true,
        //         }
        //     );

        //     io.emit("user online status", { userId, online: false });
        // });
    });
};

export default socketChat;