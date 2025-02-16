"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSuggestionController = void 0;
const suggestions_model_1 = require("../../models/suggestions.model");
const Catch_1 = require("../../utils/Catch");
const OperationalError_1 = require("../../utils/OperationalError");
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
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user',
                pipeline: [
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
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $skip: (0, QueryParamsFeatures_1.skip)(page, limit),
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
    const updated = await suggestions_model_1.SuggestionModel.findByIdAndUpdate(req.params.id, {
        seen: true,
    });
    if (updated == null) {
        throw new OperationalError_1.OperationalError('invalid ID', 404);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'suggestion marked read',
    });
});
AdminSuggestionController.suggestionDel = Catch_1.Catch.async(async (req, res) => {
    const deleted = await suggestions_model_1.SuggestionModel.findByIdAndDelete(req.params.id);
    if (deleted == null) {
        throw new OperationalError_1.OperationalError('invalid ID', 404);
    }
    (0, responder_1.sendResponse)({
        res,
        message: 'suggestion deleted',
    });
});
