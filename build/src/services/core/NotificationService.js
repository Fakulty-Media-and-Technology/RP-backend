"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const media_access_1 = require("../../../src/services/media-access");
const notifications_model_1 = require("../../models/notifications.model");
const OperationalError_1 = require("../../utils/OperationalError");
const PushNotificationService_1 = require("./PushNotificationService");
class NotificationService {
}
exports.NotificationService = NotificationService;
_a = NotificationService;
NotificationService.Push = PushNotificationService_1.PushNotificationService;
NotificationService.getNotifications = async (params) => {
    const notifications = await notifications_model_1.NotificationModel.aggregate([
        {
            $match: {
                user_id: params.currentUser._id,
            },
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'content_id',
                foreignField: '_id',
                as: 'content',
            },
        },
        {
            $project: {
                type: 1,
                title: 1,
                categories: 1,
                thumbnail: 1,
                createdAt: 1,
                content: { $first: '$content' },
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $skip: (params.page - 1) * params.limit,
        },
        {
            $limit: params.limit,
        },
    ]);
    // Get signed URLs for thumbnails
    const notificationsWithUrls = await Promise.all(notifications.map(async (notification) => {
        return {
            ...notification,
            thumbnail_url: await media_access_1.MediaAccess.getSignedUrl(notification.thumbnail.Bucket, notification.thumbnail.Key, 'photo'),
        };
    }));
    return notificationsWithUrls;
};
NotificationService.markUserNotificationSeen = async (currentUser, notificationId) => {
    const seenNotification = await notifications_model_1.NotificationModel.findOneAndUpdate({ _id: notificationId, user_id: currentUser.id }, { seen: true });
    if (seenNotification === null) {
        throw new OperationalError_1.OperationalError('Invalid notificationId', 404);
    }
};
