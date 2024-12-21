"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSuggestionController = void 0;
const suggestions_model_1 = require("../../models/suggestions.model");
const Catch_1 = require("../../utils/Catch");
const QueryParamsFeatures_1 = require("../../utils/QueryParamsFeatures");
const responder_1 = require("../../utils/responder");
class AdminSuggestionController {
}
exports.AdminSuggestionController = AdminSuggestionController;
_a = AdminSuggestionController;
AdminSuggestionController.suggestionsAll = Catch_1.Catch.async(async ({ query }, res) => {
    const limit = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.limit, 10);
    const page = (0, QueryParamsFeatures_1.handleDefaultNumAndUnknown)(query.page, 1);
    const suggestions = await suggestions_model_1.SuggestionModel.aggregate([
        {
            $match: {
                $expr: {},
            },
        },
        {
            $lookup: {
                from: 'users',
                let: {
                    uid: '$user_id',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    '$_id',
                                    {
                                        $toObjectId: '$$uid',
                                    },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            first_name: 1,
                            last_name: 1,
                            photo: 1,
                            email: 1,
                            country_code: 1,
                            mobile: 1,
                        },
                    },
                ],
                as: 'user',
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $skip: (page - 1) * limit || 0,
        },
        {
            $limit: limit,
        },
    ]);
    (0, responder_1.sendResponse)({
        res,
        data: suggestions,
        message: 'suggestions all',
    });
});
AdminSuggestionController.suggestionRead = Catch_1.Catch.async(async (req, res) => {
    const id = req.params.id;
    await suggestions_model_1.SuggestionModel.findByIdAndUpdate(id, {
        seen: true,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'suggestion marked read',
    });
});
AdminSuggestionController.suggestionDel = Catch_1.Catch.async(async (req, res) => {
    const id = req.params.id;
    await suggestions_model_1.SuggestionModel.findOneAndDelete({
        _id: id,
    });
    (0, responder_1.sendResponse)({
        res,
        message: 'suggestion deleted',
    });
});
