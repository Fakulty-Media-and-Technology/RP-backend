"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerUpcomingService = void 0;
const media_access_1 = require("../../../src/services/media-access");
const upcoming_model_1 = require("../../models/upcoming.model");
const OperationalError_1 = require("../../utils/OperationalError");
class CustomerUpcomingService {
}
exports.CustomerUpcomingService = CustomerUpcomingService;
_a = CustomerUpcomingService;
CustomerUpcomingService.fetchUpcoming = async () => {
    const comingSoon = await upcoming_model_1.UpcomingModel.aggregate([
        {
            $match: {
                active: true,
            },
        },
        {
            $lookup: {
                from: 'trailers',
                let: {
                    tid: '$trailer_id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    '$_id',
                                    {
                                        $toObjectId: '$$tid',
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            __v: 0,
                        },
                    },
                ],
                as: 'trailer',
            },
        },
        {
            $addFields: {
                trailer: { $arrayElemAt: ['$trailer', 0] },
            },
        },
    ]);
    return await Promise.all(comingSoon.map(async (ele) => {
        ele.portrait_photo = await media_access_1.MediaAccess.getSignedUrl(ele?.portrait_photo?.Bucket, ele?.portrait_photo?.Key, 'photo');
        ele.landscape_photo = await media_access_1.MediaAccess.getSignedUrl(ele?.landscape_photo?.Bucket, ele?.landscape_photo?.Key, 'photo');
        return ele;
    }));
};
CustomerUpcomingService.subscribeToUpComing = async (currentUser, upcomingId) => {
    if (currentUser.role === 'guest') {
        throw new OperationalError_1.OperationalError('you are not authenticated', 403);
    }
    const upcoming = await upcoming_model_1.UpcomingModel.findById(upcomingId);
    if (upcoming === null) {
        throw new OperationalError_1.OperationalError('Upcoming not found', 404);
    }
    if (upcoming.reminder.includes(currentUser.id)) {
        throw new OperationalError_1.OperationalError('user already subscribed', 400);
    }
    await upcoming_model_1.UpcomingModel.findOneAndUpdate({
        _id: upcomingId,
    }, {
        $push: {
            reminder: currentUser._id,
        },
    }, {
        upsert: true,
    });
};
CustomerUpcomingService.unsubscribeFromUpcoming = async (currentUser, upcomingId) => {
    if (currentUser.role === 'guest') {
        throw new OperationalError_1.OperationalError('you are not authenticated', 403);
    }
    await upcoming_model_1.UpcomingModel.findOneAndUpdate({
        _id: upcomingId,
        reminder: currentUser.id,
    }, {
        $pull: {
            reminder: currentUser._id,
        },
    }, {
        // ????
        upsert: true,
    });
};
CustomerUpcomingService.isSubscribedToUpcoming = async (currentUser, upcomingId) => {
    const upcoming = await upcoming_model_1.UpcomingModel.findOne({
        _id: upcomingId,
        reminder: currentUser.id,
    });
    return !!upcoming;
};
