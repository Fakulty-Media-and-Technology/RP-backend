"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const firebase_1 = __importDefault(require("../firebase/firebase"));
const notifications_model_1 = require("../models/notifications.model");
const userDevice_model_1 = require("../models/userDevice.model");
// ! this is not used anywhere
class Notification {
}
exports.Notification = Notification;
_a = Notification;
Notification.sendPushNotification = async (title, body, notificationData) => {
    // Get all user devices
    const userDevices = await userDevice_model_1.UserDeviceModel.find({
        user_id: notificationData.user_id,
    });
    const results = await Promise.allSettled(userDevices.map(device => {
        const message = {
            token: device.device_token,
            notification: {
                title,
                body: JSON.stringify(body),
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default_channel',
                    sound: 'default',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
            },
            data: {
                ...notificationData,
                click_action: 'NOTIFICATION_CLICK',
                // Add any additional data needed by the frontend
                notification_id: notificationData._id.toString(),
                type: notificationData.type,
            },
        };
        return firebase_1.default.messaging().send(message);
    }));
    results.forEach(result => {
        if (result.status === 'rejected') {
            console.error(`Error sending Push notification:`, result.reason);
        }
    });
};
Notification.createNotification = async (data) => {
    return new Promise(async (resolve) => {
        await new notifications_model_1.NotificationModel(data).save();
        resolve(true);
    });
};
