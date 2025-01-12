import Joi from 'joi'

import {
  FLOATS_REG,
  ISO_STRING_SCHEMA,
  LIVE_TYPE_SCHEMA,
  MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,
  MONGO_DB_OBJECT_ID_SCHEMA,
  NUMERIC_REG,
  PHOTO_SCHEMA_WITH_CONTENT_TYPE,
  PHOTO_SCHEMA,
  POSTER_SCHEMA,
  STRING_SCHEMA,
  VIDEO_CLASS_SCHEMA,
} from './common'

export const addEpisodeSchema = {
  body: Joi.object({
    episode_number: Joi.number().min(1).optional(),
    episode_title: STRING_SCHEMA.required(),
    episode_description: STRING_SCHEMA.optional(),
    video_upload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    video_link: STRING_SCHEMA.optional(),
    trailerLink: STRING_SCHEMA.optional(),
    trailerUpload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
  })
    .xor('trailerLink', 'trailerUpload')
    .xor('video_upload', 'video_link'),
}

export const addMovieOrSkitSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    video_upload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    pg: STRING_SCHEMA.pattern(NUMERIC_REG).required(),
    vid_class: STRING_SCHEMA.valid('free', 'ad', 'exclusive', 'premium').required(),
    category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    released_date: ISO_STRING_SCHEMA.required(),
    runtime: STRING_SCHEMA.required(),
    default_rating: STRING_SCHEMA.pattern(FLOATS_REG).required(),
    poster1_data: POSTER_SCHEMA.required(),
    poster2_data: POSTER_SCHEMA.required(),

    trailerLink: STRING_SCHEMA.optional(),
    trailerUpload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),

    video_link: STRING_SCHEMA.optional(),

    //
    genre: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    cast: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    expiry_date: ISO_STRING_SCHEMA,
    sub_title: STRING_SCHEMA,
  })
    .xor('trailerLink', 'trailerUpload')
    .xor('video_upload', 'video_link'),
}

export const addSeriesSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    pg: STRING_SCHEMA.pattern(NUMERIC_REG).required(),
    vid_class: VIDEO_CLASS_SCHEMA.required(),
    category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    released_date: ISO_STRING_SCHEMA.required(),
    runtime: STRING_SCHEMA.required(),
    default_rating: STRING_SCHEMA.pattern(FLOATS_REG).required(),
    poster1_data: POSTER_SCHEMA.required(),
    poster2_data: POSTER_SCHEMA.required(),

    //
    genre: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    cast: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    expiry_date: ISO_STRING_SCHEMA,
    sub_title: STRING_SCHEMA,
  }),
}

export const addMusicVideoSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    pg: STRING_SCHEMA.required(),
    vid_class: VIDEO_CLASS_SCHEMA.required(),
    video_upload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    released_date: ISO_STRING_SCHEMA.required(),
    runtime: STRING_SCHEMA.required(),
    default_rating: STRING_SCHEMA.pattern(FLOATS_REG).required(),
    poster1_data: POSTER_SCHEMA.required(),
    poster2_data: POSTER_SCHEMA.required(),
    artist_name: STRING_SCHEMA.required(),
    expiry_date: ISO_STRING_SCHEMA,
    sub_title: STRING_SCHEMA,

    video_link: STRING_SCHEMA.optional(),

    trailerLink: STRING_SCHEMA.optional(),
    trailerUpload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
  })
    .xor('trailerLink', 'trailerUpload')
    .xor('video_upload', 'video_link'),
}

export const addSubtitleSchema = {
  body: Joi.object({
    vid_id: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    bucket: STRING_SCHEMA.required(),
    key: STRING_SCHEMA.required(),
    language: STRING_SCHEMA.required(),
    is_series: Joi.boolean().required(),
  }),
}

export const getPhotoURLSchema = {
  body: Joi.object({
    bucket: STRING_SCHEMA.required(),
    key: STRING_SCHEMA.required(),
  }),
}

export const createLiveSchema = {
  body: Joi.object({
    client_id: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    title: STRING_SCHEMA.required(),
    cover_photo: PHOTO_SCHEMA_WITH_CONTENT_TYPE.required(),
    location: STRING_SCHEMA.required(),
    video: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    vid_class: VIDEO_CLASS_SCHEMA.required(),
    pg: STRING_SCHEMA.pattern(NUMERIC_REG).required(),
    description: STRING_SCHEMA.optional(),
    type: LIVE_TYPE_SCHEMA.required(),
    sponsored: Joi.boolean().optional(),
    popular: Joi.boolean().optional(),
    start: ISO_STRING_SCHEMA.required(),
    expiry: ISO_STRING_SCHEMA.required(),
  }),
}

export const createUpcomingEventSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    type: STRING_SCHEMA.valid('movie', 'series', 'music video', 'documentary', 'skit').required(),
    details: STRING_SCHEMA.required(),
    release_date: STRING_SCHEMA.required(),
    portrait_photo: PHOTO_SCHEMA_WITH_CONTENT_TYPE.required(),
    landscape_photo: PHOTO_SCHEMA_WITH_CONTENT_TYPE.required(),
    trailer_id: MONGO_DB_OBJECT_ID_SCHEMA.required(),
  }),
}

export const createPlanSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    months: Joi.number().min(0).valid(1, 3, 6, 12).required(),
    price: Joi.number().min(0).required(),
    details: STRING_SCHEMA.required(),
  }),
}

export const updatePlanSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.optional(),
    months: Joi.number().min(0).valid(1, 3, 6, 12).optional(),
    price: Joi.number().min(0).optional(),
    details: STRING_SCHEMA.optional(),
  }),
}

export const createTrailerSchema = {
  body: Joi.object({
    video_id: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    video_title: STRING_SCHEMA.optional(),
    details: STRING_SCHEMA.optional(),
    video_upload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
  }),
}

export const updateTrailerSchema = {
  body: Joi.object({
    video_id: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
    video_title: STRING_SCHEMA.optional(),
    details: STRING_SCHEMA.optional(),
    video_upload: MONGO_DB_OBJECT_ID_SCHEMA.optional(),
  }).or('video_id', 'video_title', 'details', 'video_upload'),
}

export const createGiftCardSchema = {
  body: Joi.object({
    amount: Joi.number().min(0).required(),
  }),
}

export const updatePayOutReqStatusSchema = {
  body: Joi.object({
    status: STRING_SCHEMA.valid('processing', 'reversed', 'rejected', 'completed').required(),
  }),
}

export const addFeaturedContentSchema = {
  body: Joi.object({
    id: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    expiry: STRING_SCHEMA.isoDate().required(),
    type: STRING_SCHEMA.valid('event', 'vod').required(),
  }),
}

export const addGenreSchema = {
  body: Joi.object({
    name: STRING_SCHEMA.required(),
  }),
}

export const addCastSchema = {
  body: Joi.object({
    name: STRING_SCHEMA.required(),
    title: STRING_SCHEMA.required(),
  }),
}

//

export const addCategorySchema = {
  body: Joi.object({
    name: STRING_SCHEMA.required(),
    position: Joi.number().required(),
  }),
}

export const updateCategorySchema = {
  body: Joi.object({
    name: STRING_SCHEMA,
    position: Joi.number(),
  }).or('name', 'position'),
}

export const createAdminORSuperAdminSchema = {
  body: Joi.object({
    first_name: STRING_SCHEMA.required(),
    last_name: STRING_SCHEMA.required(),
    email: STRING_SCHEMA.email().required(),
    password: STRING_SCHEMA.required(),
    cpassword: STRING_SCHEMA.required(),
    country_code: STRING_SCHEMA.required(),
    mobile: STRING_SCHEMA.required(),
  }),
}

export const createClientSchema = {
  body: Joi.object({
    first_name: STRING_SCHEMA.required(),
    last_name: STRING_SCHEMA.required(),
    email: STRING_SCHEMA.email().required(),
    password: STRING_SCHEMA.required(),
    cpassword: STRING_SCHEMA.required(),
    country_code: STRING_SCHEMA.required(),
    mobile: STRING_SCHEMA.required(),
    verified: Joi.boolean().required(),
    client_type: STRING_SCHEMA.valid('channel', 'tvshow', 'event', 'podcast').required(),

    photo: Joi.object({
      Bucket: STRING_SCHEMA.required(),
      Key: STRING_SCHEMA.required(),
    }).optional(),
  }),
}

export const createAdSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    sub_title: STRING_SCHEMA,
    type: STRING_SCHEMA.valid('general', 'movie_ad', 'web', 'mobile'),
    brand: STRING_SCHEMA.required(),
    photo: PHOTO_SCHEMA.optional(),
    link: STRING_SCHEMA,
    duration: Joi.number(),
    start: STRING_SCHEMA.isoDate(),
    expiry: STRING_SCHEMA.isoDate(),
    active: Joi.boolean(),
  }),
}
