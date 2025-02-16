"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDeviceModel = void 0;
const mongoose_1 = require("mongoose");
const userdeviceSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    device_id: {
        type: String,
        required: true,
    },
    device_token: {
        type: String,
        required: true,
    },
    device_type: {
        type: String,
        enum: ['ios', 'android', 'web'],
        required: true,
    },
}, {
    timestamps: true,
});
exports.UserDeviceModel = (0, mongoose_1.model)('userdevices', userdeviceSchema);
