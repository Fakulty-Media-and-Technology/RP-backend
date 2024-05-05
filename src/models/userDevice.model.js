const mongoose = require("mongoose");

const userdeviceSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "users",
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
            enum: ["ios", "android", "web"],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("userdevice", userdeviceSchema);
