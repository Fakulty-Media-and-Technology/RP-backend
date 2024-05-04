const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema(
    {
        first_name: {
            type: String,
            lowercase: true,
            trim: true,
            required: true,
        },
        last_name: {
            type: String,
            lowercase: true,
            trim: true,
            required: true,
        },
        email: {
            type: String,
            trim: true,
            required: true,
        },
        country_code: {
            type: String,
            trim: true,
            required: true,
        },
        mobile: {
            type: String,
            trim: true,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        pin: {
            type: String,
            // required: true,
        },
        role: {
            type: String,
            enum: [
                "customer",
                "channel",
                "tvshow",
                "event",
                "podcast",
                "admin",
                "superadmin",
            ],
            default: "customer",
            required: true,
        },
        photo: {
            type: Object,
        },
        auth_code: {
            type: Number,
            default: undefined,
        },
        auth_expiry: {
            type: Number,
            default: undefined,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        approved: {
            type: Boolean,
            default: false,
        },
        suspended: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// usersSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("users", usersSchema);
