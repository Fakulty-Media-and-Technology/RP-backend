"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanModel = void 0;
const mongoose_1 = require("mongoose");
const planSchema = new mongoose_1.Schema({
    admin_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    months_duration: {
        type: Number,
        unique: true,
        enum: [1, 3, 6, 12],
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
exports.PlanModel = (0, mongoose_1.model)('Plan', planSchema);
