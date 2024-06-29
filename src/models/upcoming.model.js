const mongoose = require("mongoose");

const upcomingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        details: {
            type: String,
            required: true
        },
        release_date: {
            type: Date,
            required: true
        },
        portrait_photo: {
            type: Object,
            required: true
        },
        landscape_photo: {
            type: Object,
            required: true
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("upcoming", upcomingSchema);
