const mongoose = require("mongoose");

const liveVideosSchema = new mongoose.Schema(
    {
        client_id: {
            type: mongoose.Types.ObjectId,
            ref: "users",
            required: true,
        },
        expiry: {
            type: mongoose.Types.ObjectId,
            ref: "users",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("live", liveVideosSchema);
