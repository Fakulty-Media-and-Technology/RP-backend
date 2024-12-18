"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionModel = void 0;
const mongoose_1 = require("mongoose");
const suggestionSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    seen: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.SuggestionModel = (0, mongoose_1.model)('Suggestion', suggestionSchema);
