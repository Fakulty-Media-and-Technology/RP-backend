"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerCommentsRatingsService = void 0;
const comments_model_1 = require("../../models/comments.model");
const rating_model_1 = require("../../models/rating.model");
const VideoRepo_1 = require("../../repositories/VideoRepo");
const OperationalError_1 = require("../../utils/OperationalError");
class CustomerCommentsRatingsService {
}
exports.CustomerCommentsRatingsService = CustomerCommentsRatingsService;
_a = CustomerCommentsRatingsService;
CustomerCommentsRatingsService.addComment = async (input) => {
    const comment = await comments_model_1.CommentModel.create(input);
    return comment;
};
CustomerCommentsRatingsService.updateComment = async (commentId, message) => {
    const comment = await comments_model_1.CommentModel.findByIdAndUpdate(commentId, { message }, { new: true });
    if (comment == null) {
        throw new OperationalError_1.OperationalError('Invalid comment ID', 400);
    }
    return comment;
};
CustomerCommentsRatingsService.deleteComment = async (commentId) => {
    const deletedComment = await comments_model_1.CommentModel.findByIdAndDelete(commentId);
    if (deletedComment == null) {
        throw new OperationalError_1.OperationalError('Invalid comment ID', 400);
    }
};
CustomerCommentsRatingsService.getComments = async (parentId) => {
    const comments = await comments_model_1.CommentModel.aggregate([
        {
            $match: {
                parentId: (0, VideoRepo_1.toObjectId)(parentId),
            },
        },
        {
            $group: {
                _id: null,
                totalComments: { $sum: 1 },
                comments: { $push: '$$ROOT' },
            },
        },
    ]);
    return comments;
};
// ********* Ratings
CustomerCommentsRatingsService.addRating = async (data) => {
    const rating = await rating_model_1.RatingModel.create(data);
    return rating;
};
CustomerCommentsRatingsService.getRatings = async (parentId) => {
    const ratings = await rating_model_1.RatingModel.aggregate([
        {
            $match: {
                parentId: (0, VideoRepo_1.toObjectId)(parentId),
            },
        },
        {
            $group: {
                _id: null,
                totalRatings: { $sum: 1 },
                averageRatings: { $avg: '$rate' },
                ratings: { $push: '$$ROOT' },
            },
        },
    ]);
    return ratings;
};
CustomerCommentsRatingsService.updateRating = async ({ ratingId, comment, rate }) => {
    const rating = await rating_model_1.RatingModel.findById(ratingId);
    if (rating === null) {
        throw new OperationalError_1.OperationalError('invalid rating Id', 404);
    }
    rating.comment = comment ? comment : rating.comment;
    rating.rate = rate ? rate : rating.rate;
    await rating.save();
};
CustomerCommentsRatingsService.deleteRating = async (ratingId) => {
    const deletedRating = await rating_model_1.RatingModel.findByIdAndDelete(ratingId);
    if (deletedRating === null) {
        throw new OperationalError_1.OperationalError('invalid rating Id', 404);
    }
};
