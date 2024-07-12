const mongoose = require("mongoose");

const videosSchema = new mongoose.Schema(
    {
        admin_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "users",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: [
                "movie",
                "series",
                "music video",
                "ducumentary",
                "skit",
            ],
            required: true,
        },
        key: {
            type: String,
            trim: true,
            required: true,
        },
        description: {
            type: String,
            trim: true,
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
        genre: {
            type: [String], //mongoose.SchemaTypes.ObjectId
            ref: "genre_enum",
        },
        category: {
            type: [String],
            ref: "category_enum",
        },
        released_date: {
            type: Date,
        },
        expiry_date: {
            type: Date,
        },
        likes: {
            type: [String],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("videos", videosSchema);
