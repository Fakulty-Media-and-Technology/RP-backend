"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const comments_ratings_customer_1 = require("../../controllers/customers/comments.ratings.customer");
const requestValidator_1 = require("../../middlewares/requestValidator");
const customers_1 = require("../../validations/customers");
exports.router = (0, express_1.Router)();
exports.router.post('/create', (0, requestValidator_1.requestValidator)(customers_1.createCommentSchema), comments_ratings_customer_1.CustomerCommentsRatingsController.addComment);
exports.router.get('/fetch/:parentId', comments_ratings_customer_1.CustomerCommentsRatingsController.getComments);
exports.router
    .route('/:commentId')
    .put((0, requestValidator_1.requestValidator)(customers_1.updateCommentSchema), comments_ratings_customer_1.CustomerCommentsRatingsController.updateComment)
    .delete(comments_ratings_customer_1.CustomerCommentsRatingsController.deleteComment);
