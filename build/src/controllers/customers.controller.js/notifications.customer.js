"use strict";
const NotificationsModel = require('../../models/notifications.model');
const { readPhotos } = require('../../services/media-access');
const { successResponse, serverError } = require('../../utils/response.handler');
exports.getNotifications = async (req, res) => {
    try {
        const user = req.user;
        const limit = req.query.limit || 20;
        const page = req.query.page || 1;
        const notifications = await NotificationsModel.aggregate([
            {
                $match: {
                    user_id: user._id,
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
                $skip: (page - 1) * limit,
            },
            {
                $limit: limit,
            },
        ]);
        // Get signed URLs for thumbnails
        const notificationsWithUrls = await Promise.all(notifications.map(async (notification) => {
            const thumbnailUrl = await readPhotos(notification.thumbnail.Bucket, notification.thumbnail.Key);
            return {
                ...notification,
                thumbnail_url: thumbnailUrl.status === 400 ? null : thumbnailUrl,
            };
        }));
        return successResponse(res, 200, notificationsWithUrls, 'Notifications fetched successfully');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
exports.handleNotificationClick = async (req, res) => {
    try {
        const { notification_id } = req.params;
        const user = req.user;
        // Mark notification as seen
        await NotificationsModel.findOneAndUpdate({ _id: notification_id, user_id: user._id }, { seen: true });
        return successResponse(res, 200, { notification_id }, 'Notification marked as seen');
    }
    catch (error) {
        return serverError(res, 500, null, error.message);
    }
};
