"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanModel = void 0;
const mongoose_1 = require("mongoose");
const schema = new mongoose_1.Schema({
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
        enum: [1, 3, 6, 12],
        unique: true,
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
    methods: {
        getFutureDate(days = 30) {
            const daysInMilliseconds = days * 24 * 60 * 60 * 1000;
            const now = new Date();
            const futureDate = new Date(now.getTime() + Number(this.months_duration) * daysInMilliseconds);
            return futureDate;
        },
    },
});
exports.PlanModel = (0, mongoose_1.model)('plans', schema);
