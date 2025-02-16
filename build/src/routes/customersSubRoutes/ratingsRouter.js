"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const comments_ratings_customer_1 = require("../../controllers/customers/comments.ratings.customer");
const requestValidator_1 = require("../../middlewares/requestValidator");
const customers_1 = require("../../validations/customers");
exports.router = (0, express_1.Router)();
exports.router.post('/create', (0, requestValidator_1.requestValidator)(customers_1.createRatingSchema), comments_ratings_customer_1.CustomerCommentsRatingsController.addRating);
exports.router.get('/fetch/:parentId', comments_ratings_customer_1.CustomerCommentsRatingsController.getRatings);
exports.router
    .route('/:ratingId')
    .put((0, requestValidator_1.requestValidator)(customers_1.updateRatingSchema), comments_ratings_customer_1.CustomerCommentsRatingsController.updateRating)
    .delete(comments_ratings_customer_1.CustomerCommentsRatingsController.deleteRating);
