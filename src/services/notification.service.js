const NotificationsModel = require("../models/notifications.model");
const UsersModel = require("../models/users.model");

exports.createNewArrivalNotification = async (content) => {
     try {
          // Get all users
          const users = await UsersModel.find({ role: "customer" });

          // Create notifications for each user
          const notifications = users.map((user) => ({
               user_id: user._id,
               type: "NEW_ARRIVAL",
               content_id: content._id,
               title: content.title,
               categories: [content.genre, content.vid_class, content.category],
               thumbnail: content.cover_photo,
          }));

          await NotificationsModel.insertMany(notifications);
     } catch (error) {
          console.error("Error creating notifications:", error);
     }
};
