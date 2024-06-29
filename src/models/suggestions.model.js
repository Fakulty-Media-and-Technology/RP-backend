const mongoose = require("mongoose");

const suggestionScahema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "users",
            required: true,
        },
        message: {
            type: String,
            required: true
        },
        seen: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("suggestion", suggestionScahema);
