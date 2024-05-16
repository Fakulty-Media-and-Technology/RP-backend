const mongoose = require("mongoose");

const liveVideosSchema = new mongoose.Schema(
    {
        client_id: {
            type: mongoose.Types.ObjectId,
            ref: "users",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        sub_title: {
            type: String,
            required: true,
        },
        photo: {
            type: String,
            required: true,
        },
        class: {
            type: String,
            enum: ["free", "ad", "exclusive", "premium"],
            required: true,
        },
        pg: {
            type: String,
            required: true,
        },
        category: {
            type: [String],
            ref: "category_enum",
        },
        description: {
            type: String,
        },
        active: {
            type: Boolean,
        },
        type: {
            type: String,
            enum: ["channel", "event", "tvshow"],
        },
        start: {
            type: Number, //Date in milisec
        },
        expiry: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("live", liveVideosSchema);
