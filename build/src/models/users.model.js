"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const usersSchema = new mongoose_1.Schema({
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
        lowercase: true,
        required: [true, 'Email is required'],
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
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
        enum: ['customer', 'channel', 'tvshow', 'event', 'podcast', 'admin', 'superadmin'],
        default: 'customer',
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
    gender: {
        type: String,
        enum: ['male', 'female', 'nil'],
    },
    dob: {
        type: Date,
    },
    country: {
        type: String,
        trim: true,
        lowercase: true,
    },
}, {
    timestamps: true,
});
// usersSchema.index({ location: "2dsphere" });
exports.UserModel = (0, mongoose_1.model)('User', usersSchema);
