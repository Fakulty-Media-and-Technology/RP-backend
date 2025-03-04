"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdSchema = exports.createClientSchema = exports.createAdminORSuperAdminSchema = exports.updateCategorySchema = exports.addCategorySchema = exports.addCastSchema = exports.addGenreSchema = exports.addFeaturedContentSchema = exports.updatePayOutReqStatusSchema = exports.createGiftCardSchema = exports.updateTrailerSchema = exports.createTrailerSchema = exports.updatePlanSchema = exports.createPlanSchema = exports.createUpcomingEventSchema = exports.addLiveSchema = exports.getPhotoURLSchema = exports.addSubtitleSchema = exports.editVideoSchema = exports.addMusicVideoSchema = exports.addSeriesSchema = exports.addMovieOrSkitSchema = exports.addEpisodeSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
exports.addEpisodeSchema = joi_1.default.object({
    title: common_1.STRING_SCHEMA.required(),
    description: common_1.STRING_SCHEMA.optional(),
    videoLink: common_1.STRING_SCHEMA.optional(),
    trailerLink: common_1.STRING_SCHEMA.optional(),
    video: joi_1.default.object().optional(), // file
    trailer: joi_1.default.object().optional(), // file
})
    .xor('trailerLink', 'trailer')
    .xor('video', 'videoLink');
exports.addMovieOrSkitSchema = joi_1.default.object({
    title: common_1.STRING_SCHEMA.required(),
    pg: common_1.STRING_SCHEMA.required(),
    releasedDate: common_1.ISO_STRING_SCHEMA.required(),
    // enums
    category: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    genre: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.max(3).required(),
    cast: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.max(10).required(),
    // maps to details in UI
    description: common_1.STRING_SCHEMA.required(),
    amount: joi_1.default.number().strict(),
    runtime: common_1.STRING_SCHEMA,
    defaultRating: common_1.STRING_SCHEMA.pattern(common_1.FLOATS_REG),
    // files
    landscapePoster: joi_1.default.object().required(),
    portraitPoster: joi_1.default.object().required(),
    trailer: joi_1.default.object().optional(), // file
    trailerLink: common_1.STRING_SCHEMA.optional(),
    active: joi_1.default.boolean(),
    showViews: joi_1.default.boolean(),
    video: joi_1.default.object().optional(), //file
    videoLink: common_1.STRING_SCHEMA.optional(),
    vidClass: common_1.STRING_SCHEMA.valid('free', 'ad', 'exclusive', 'premium').required(),
    expiryDate: common_1.ISO_STRING_SCHEMA,
})
    .xor('trailerLink', 'trailer')
    .xor('video', 'videoLink');
exports.addSeriesSchema = joi_1.default.object({
    title: common_1.STRING_SCHEMA.required(),
    pg: common_1.STRING_SCHEMA.pattern(common_1.NUMERIC_REG).required(),
    vidClass: common_1.VIDEO_CLASS_SCHEMA.required(),
    category: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    releasedDate: common_1.ISO_STRING_SCHEMA.required(),
    runtime: common_1.STRING_SCHEMA.required(),
    defaultRating: common_1.STRING_SCHEMA.pattern(common_1.FLOATS_REG).required(),
    description: common_1.STRING_SCHEMA,
    amount: joi_1.default.number().strict(),
    // files
    landscapePoster: joi_1.default.object().required(),
    portraitPoster: joi_1.default.object().required(),
    trailer: joi_1.default.object().optional(), // file
    trailerLink: common_1.STRING_SCHEMA.optional(),
    active: joi_1.default.boolean(),
    showViews: joi_1.default.boolean(),
    //
    genre: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    cast: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    expiryDate: common_1.ISO_STRING_SCHEMA,
}).xor('trailerLink', 'trailer');
exports.addMusicVideoSchema = joi_1.default.object({
    title: common_1.STRING_SCHEMA.required(),
    pg: common_1.STRING_SCHEMA.required(),
    vidClass: common_1.VIDEO_CLASS_SCHEMA.required(),
    category: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    releasedDate: common_1.ISO_STRING_SCHEMA.required(),
    runtime: common_1.STRING_SCHEMA.required(),
    defaultRating: common_1.STRING_SCHEMA.pattern(common_1.FLOATS_REG).required(),
    artistName: common_1.STRING_SCHEMA.required(),
    expiryDate: common_1.ISO_STRING_SCHEMA,
    description: common_1.STRING_SCHEMA,
    amount: joi_1.default.number().strict(),
    // files
    landscapePoster: joi_1.default.object().required(),
    portraitPoster: joi_1.default.object().required(),
    video: joi_1.default.object().optional(), // file
    videoLink: common_1.STRING_SCHEMA.optional(),
    active: joi_1.default.boolean(),
    showViews: joi_1.default.boolean(),
    trailerLink: common_1.STRING_SCHEMA.optional(), // file
    trailer: joi_1.default.object().optional(),
})
    .xor('trailerLink', 'trailer')
    .xor('video', 'videoLink');
exports.editVideoSchema = joi_1.default.object({
    title: common_1.STRING_SCHEMA,
    pg: common_1.STRING_SCHEMA,
    vidClass: common_1.VIDEO_CLASS_SCHEMA,
    releasedDate: common_1.ISO_STRING_SCHEMA,
    runtime: common_1.STRING_SCHEMA,
    defaultRating: common_1.STRING_SCHEMA.pattern(common_1.FLOATS_REG),
    artistName: common_1.STRING_SCHEMA,
    expiryDate: common_1.ISO_STRING_SCHEMA,
    description: common_1.STRING_SCHEMA,
    category: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,
    genre: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,
    cast: common_1.MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,
    amount: joi_1.default.number().strict(),
    // files
    landscapePoster: joi_1.default.object(),
    portraitPoster: joi_1.default.object(),
    video: joi_1.default.object(), // file
    videoLink: common_1.STRING_SCHEMA,
    active: joi_1.default.boolean(),
    upcoming: joi_1.default.boolean(),
    showViews: joi_1.default.boolean(),
    trailerLink: common_1.STRING_SCHEMA, // file
    trailer: joi_1.default.object(),
});
exports.addSubtitleSchema = joi_1.default.object({
    parentId: common_1.MONGO_DB_OBJECT_ID_SCHEMA.required(),
    parentType: common_1.STRING_SCHEMA.valid('vod', 'episode').required(),
    language: common_1.STRING_SCHEMA.required(),
    subtitle: joi_1.default.object().required(),
});
exports.getPhotoURLSchema = {
    body: joi_1.default.object({
        bucket: common_1.STRING_SCHEMA.required(),
        key: common_1.STRING_SCHEMA.required(),
    }),
};
exports.addLiveSchema = joi_1.default.object({
    clientId: common_1.MONGO_DB_OBJECT_ID_SCHEMA.required(),
    title: common_1.STRING_SCHEMA.required(),
    pg: common_1.STRING_SCHEMA.required(),
    start: common_1.ISO_STRING_SCHEMA.required(),
    expiry: common_1.ISO_STRING_SCHEMA.required(),
    coverPhoto: joi_1.default.object().required(),
    previewVideo: joi_1.default.object(),
    description: common_1.STRING_SCHEMA,
    vidClass: common_1.STRING_SCHEMA.valid('free', 'ad', 'exclusive', 'premium').required(),
    type: common_1.LIVE_TYPE_SCHEMA.required(),
    sponsored: joi_1.default.boolean(),
    popular: joi_1.default.boolean(),
    location: common_1.STRING_SCHEMA,
});
exports.createUpcomingEventSchema = joi_1.default.object({
    title: common_1.STRING_SCHEMA.required(),
    type: common_1.STRING_SCHEMA.valid('movie', 'series', 'music video', 'documentary', 'skit').required(),
    details: common_1.STRING_SCHEMA.required(),
    releaseDate: common_1.ISO_STRING_SCHEMA.required(),
    active: joi_1.default.boolean(),
    trailerLink: common_1.STRING_SCHEMA,
    trailer: joi_1.default.object(),
    portraitPhoto: joi_1.default.object().required(),
    landscapePhoto: joi_1.default.object().required(),
});
exports.createPlanSchema = {
    body: joi_1.default.object({
        title: common_1.STRING_SCHEMA.required(),
        months: joi_1.default.number().min(0).valid(1, 3, 6, 12).required(),
        price: joi_1.default.number().min(0).required(),
        details: common_1.STRING_SCHEMA.required(),
    }),
};
exports.updatePlanSchema = {
    body: joi_1.default.object({
        title: common_1.STRING_SCHEMA.optional(),
        months: joi_1.default.number().min(0).valid(1, 3, 6, 12).optional(),
        price: joi_1.default.number().min(0).optional(),
        details: common_1.STRING_SCHEMA.optional(),
    }),
};
exports.createTrailerSchema = {
    body: joi_1.default.object({
        video_id: common_1.MONGO_DB_OBJECT_ID_SCHEMA.optional(),
        video_title: common_1.STRING_SCHEMA.optional(),
        details: common_1.STRING_SCHEMA.optional(),
        video_upload: common_1.MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    }),
};
exports.updateTrailerSchema = {
    body: joi_1.default.object({
        video_id: common_1.MONGO_DB_OBJECT_ID_SCHEMA.optional(),
        video_title: common_1.STRING_SCHEMA.optional(),
        details: common_1.STRING_SCHEMA.optional(),
        video_upload: common_1.MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    }).or('video_id', 'video_title', 'details', 'video_upload'),
};
exports.createGiftCardSchema = {
    body: joi_1.default.object({
        amount: joi_1.default.number().min(0).required(),
    }),
};
exports.updatePayOutReqStatusSchema = {
    body: joi_1.default.object({
        status: common_1.STRING_SCHEMA.valid('processing', 'reversed', 'rejected', 'completed').required(),
    }),
};
exports.addFeaturedContentSchema = {
    body: joi_1.default.object({
        id: common_1.MONGO_DB_OBJECT_ID_SCHEMA.required(),
        expiry: common_1.STRING_SCHEMA.isoDate().required(),
        type: common_1.STRING_SCHEMA.valid('event', 'vod').required(),
    }),
};
exports.addGenreSchema = {
    body: joi_1.default.object({
        name: common_1.STRING_SCHEMA.required(),
        position: joi_1.default.number().required(),
    }),
};
exports.addCastSchema = {
    body: joi_1.default.object({
        name: common_1.STRING_SCHEMA.required(),
        title: common_1.STRING_SCHEMA.required(),
    }),
};
exports.addCategorySchema = {
    body: joi_1.default.object({
        name: common_1.STRING_SCHEMA.required(),
        position: joi_1.default.number().required(),
    }),
};
exports.updateCategorySchema = {
    body: joi_1.default.object({
        name: common_1.STRING_SCHEMA,
        position: joi_1.default.number(),
    }).or('name', 'position'),
};
exports.createAdminORSuperAdminSchema = {
    body: joi_1.default.object({
        first_name: common_1.STRING_SCHEMA.required(),
        last_name: common_1.STRING_SCHEMA.required(),
        email: common_1.STRING_SCHEMA.email().required(),
        password: common_1.STRING_SCHEMA.required(),
        cpassword: common_1.STRING_SCHEMA.required(),
        country_code: common_1.STRING_SCHEMA.required(),
        mobile: common_1.STRING_SCHEMA.required(),
    }),
};
exports.createClientSchema = {
    body: joi_1.default.object({
        first_name: common_1.STRING_SCHEMA.required(),
        last_name: common_1.STRING_SCHEMA.required(),
        email: common_1.STRING_SCHEMA.email().required(),
        password: common_1.STRING_SCHEMA.required(),
        cpassword: common_1.STRING_SCHEMA.required(),
        country_code: common_1.STRING_SCHEMA.required(),
        mobile: common_1.STRING_SCHEMA.required(),
        verified: joi_1.default.boolean().required(),
        client_type: common_1.STRING_SCHEMA.valid('channel', 'tvshow', 'event', 'podcast').required(),
        photo: joi_1.default.object({
            Bucket: common_1.STRING_SCHEMA.required(),
            Key: common_1.STRING_SCHEMA.required(),
        }).optional(),
    }),
};
exports.createAdSchema = {
    body: joi_1.default.object({
        title: common_1.STRING_SCHEMA.required(),
        sub_title: common_1.STRING_SCHEMA,
        type: common_1.STRING_SCHEMA.valid('general', 'movie_ad', 'web', 'mobile'),
        brand: common_1.STRING_SCHEMA.required(),
        photo: common_1.PHOTO_SCHEMA.optional(),
        link: common_1.STRING_SCHEMA,
        duration: joi_1.default.number(),
        start: common_1.STRING_SCHEMA.isoDate(),
        expiry: common_1.STRING_SCHEMA.isoDate(),
        active: joi_1.default.boolean(),
    }),
};
