import Joi from 'joi'

import {
  FLOATS_REG,
  ISO_STRING_SCHEMA,
  LIVE_TYPE_SCHEMA,
  MONGO_DB_OBJECT_ID_ARRAY_SCHEMA,
  MONGO_DB_OBJECT_ID_SCHEMA,
  NUMERIC_REG,
  PHOTO_SCHEMA,
  POSTER_SCHEMA,
  STRING_SCHEMA,
  VIDEO_CLASS_SCHEMA,
} from './common'

const VIDEO_SCHEMA = Joi.object({
  bucket: STRING_SCHEMA.required(),
  key: STRING_SCHEMA.required(),
})

const episodeSchema = Joi.object({
  season: Joi.number().min(1).required(),
  episode_number: Joi.number().min(1).required(),
  episode_title: STRING_SCHEMA.required(),
  episode_description: STRING_SCHEMA.required(),
  bucket: STRING_SCHEMA.required(),
  key: STRING_SCHEMA.required(),
})

export const addMovieOrSkitSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    key: STRING_SCHEMA.required(),
    pg: STRING_SCHEMA.pattern(NUMERIC_REG).required(),
    vid_class: STRING_SCHEMA.valid('free', 'ad', 'exclusive', 'premium').required(),
    category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    released_date: ISO_STRING_SCHEMA.required(),
    runtime: STRING_SCHEMA.required(),
    default_rating: STRING_SCHEMA.pattern(FLOATS_REG).required(),
    poster1_data: POSTER_SCHEMA.required(),
    poster2_data: POSTER_SCHEMA.required(),

    //
    bucket: STRING_SCHEMA.required(),
    genre: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    cast: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    expiry_date: ISO_STRING_SCHEMA,
    sub_title: STRING_SCHEMA,
  }),
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
    episodes: Joi.array().items(episodeSchema).required(),
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
    category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    released_date: ISO_STRING_SCHEMA.required(),
    runtime: STRING_SCHEMA.required(),
    default_rating: STRING_SCHEMA.pattern(FLOATS_REG).required(),
    poster1_data: POSTER_SCHEMA.required(),
    poster2_data: POSTER_SCHEMA.required(),
    artist_name: STRING_SCHEMA.required(),
    bucket: STRING_SCHEMA.required(),
    key: STRING_SCHEMA.required(),
    expiry_date: ISO_STRING_SCHEMA,
    sub_title: STRING_SCHEMA,
  }),
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
    client_id: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    title: STRING_SCHEMA.required(),
    sub_title: STRING_SCHEMA.optional(),
    cover_photo: PHOTO_SCHEMA.required(),
    location: STRING_SCHEMA.required(),
    video: VIDEO_SCHEMA.optional(),
    vid_class: VIDEO_CLASS_SCHEMA.required(),
    pg: STRING_SCHEMA.pattern(NUMERIC_REG).required(),
    category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.optional(),
    description: STRING_SCHEMA.optional(),
    type: LIVE_TYPE_SCHEMA.required(),
    sponsored: Joi.boolean().required(),
    popular: Joi.boolean().required(),
    start: ISO_STRING_SCHEMA.required(),
    expiry: ISO_STRING_SCHEMA.required(),
  }),
}

export const createUpcomingSchema = {
  body: Joi.object({
    title: STRING_SCHEMA.required(),
    type: STRING_SCHEMA.valid('movie', 'series', 'music video', 'documentary', 'skit').required(),
    details: STRING_SCHEMA.required(),
    release_date: STRING_SCHEMA.required(),
    portrait_photo: PHOTO_SCHEMA.required(),
    landscape_photo: PHOTO_SCHEMA.required(),
    trailer_id: MONGO_DB_OBJECT_ID_SCHEMA.required(),
  }),
}
