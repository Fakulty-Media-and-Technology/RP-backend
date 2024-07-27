const admin = require("../firebase/firebase");
const NotificationsModel = require("../models/notifications.model");

exports.sendPushNotification = async (
     device_token,
     title,
     body_message,
     device_type,
     notificationData,
     sound = "default"
) => {
     try {
          notificationData.sender_id =
               notificationData.sender_id.toString() ||
               process.env.FCM_SENDERID;
          notificationData.receiver_id =
               notificationData.receiver_id.toString();
          notificationData.value_id = notificationData.value_id
               ? notificationData.value_id.toString()
               : "";
          notificationData.title = title;
          notificationData.body = body_message;

          const notification = {
               title: title,
               body: body_message,
               //   imageUrl: "",
          };

          var message = {
               notification: notification,
               data: notificationData,
               apns: {
                    headers: {
                         "apns-priority": "10",
                    },
                    payload: {
                         aps: {
                              sound: "default",
                         },
                    },
               },
               android: {
                    priority: "high",
                    notification: {
                         sound: "default",
                    },
               },
               token: device_token,
          };

          console.log("final message", message);

          admin.messaging()
               .send(message)
               .then((response) => {
                    console.log("Successfully sent message:", response);
               })
               .catch((error) => {
                    console.log("Error sending message:", error);
               });
     } catch (err) {
          console.log(err);
          return false;
     }
};

exports.createNotification = async (data) => {
     return new Promise(async (resolve, reject) => {
          await new NotificationsModel(data).save();
          resolve(true);
     });
};
