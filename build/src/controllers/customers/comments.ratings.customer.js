"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerCommentsRatingsController = void 0;
const CustomerCommentsRatingsService_1 = require("../../services/core/CustomerCommentsRatingsService");
const Catch_1 = require("../../utils/Catch");
const denyGuestUser_1 = require("../../utils/denyGuestUser");
const GetDefined_1 = require("../../utils/GetDefined");
const responder_1 = require("../../utils/responder");
class CustomerCommentsRatingsController {
}
exports.CustomerCommentsRatingsController = CustomerCommentsRatingsController;
_a = CustomerCommentsRatingsController;
CustomerCommentsRatingsController.addComment = Catch_1.Catch.async(async (req, res) => {
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    const comment = await CustomerCommentsRatingsService_1.CustomerCommentsRatingsService.addComment({
        ...req.body,
        userId: user.id,
    });
    (0, responder_1.sendResponse)({
        res,
        data: comment,
        message: 'comment created successfully',
    });
});
CustomerCommentsRatingsController.getComments = Catch_1.Catch.async(async (req, res) => {
    const comments = await CustomerCommentsRatingsService_1.CustomerCommentsRatingsService.getComments(req.params.parentId);
    (0, responder_1.sendResponse)({
        res,
        data: comments,
        message: 'comments fetched successfully',
    });
});
CustomerCommentsRatingsController.updateComment = Catch_1.Catch.async(async (req, res) => {
    const comment = await CustomerCommentsRatingsService_1.CustomerCommentsRatingsService.updateComment(req.params.commentId, req.body.message);
    (0, responder_1.sendResponse)({
        res,
        data: comment,
        message: 'comment updated successfully',
    });
});
CustomerCommentsRatingsController.deleteComment = Catch_1.Catch.async(async (req, res) => {
    await CustomerCommentsRatingsService_1.CustomerCommentsRatingsService.deleteComment(req.params.commentId);
    (0, responder_1.sendResponse)({
        res,
        message: 'comment deleted successfully',
    });
});
CustomerCommentsRatingsController.addRating = Catch_1.Catch.async(async (req, res) => {
    const user = GetDefined_1.GetDefined.loggedInUser(req.user);
    (0, denyGuestUser_1.denyGuestUser)(user);
    const rating = await CustomerCommentsRatingsService_1.CustomerCommentsRatingsService.addRating({
        ...req.body,
        userId: user.id,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'rating created successfully',
        data: rating,
    });
});
CustomerCommentsRatingsController.getRatings = Catch_1.Catch.async(async (req, res) => {
    (0, responder_1.sendResponse)({
        res,
        message: 'rating fetched successfully',
        data: await CustomerCommentsRatingsService_1.CustomerCommentsRatingsService.getRatings(req.params.parentId),
    });
});
CustomerCommentsRatingsController.updateRating = Catch_1.Catch.async(async (req, res) => {
    const rating = await CustomerCommentsRatingsService_1.CustomerCommentsRatingsService.updateRating({
        ...req.body,
        ratingId: req.params.ratingId,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'rating updated successfully',
        data: rating,
    });
});
CustomerCommentsRatingsController.deleteRating = Catch_1.Catch.async(async (req, res) => {
    await CustomerCommentsRatingsService_1.CustomerCommentsRatingsService.deleteRating(req.params.ratingId);
    (0, responder_1.sendResponse)({
        res,
        message: 'rating deleted successfully',
    });
});
