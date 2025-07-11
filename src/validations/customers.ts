import Joi from 'joi'
import { MONGO_DB_OBJECT_ID_SCHEMA, STRING_SCHEMA } from './common'

export const createCustomerSchema = {
  body: Joi.object({
    first_name: STRING_SCHEMA.required(),
    last_name: STRING_SCHEMA.required(),
    email: STRING_SCHEMA.email().required(),
    password: STRING_SCHEMA.required(),
    cpassword: STRING_SCHEMA.required(),
    country_code: STRING_SCHEMA.required(),
    mobile: STRING_SCHEMA.required(),
    verified: Joi.boolean().required(),
    gender: STRING_SCHEMA.valid('male', 'female', 'nil'),
    dob: STRING_SCHEMA.isoDate(),
    country: STRING_SCHEMA,
  }),
}

export const fetchUpcomingSchema = {
  query: Joi.object({
    page: Joi.number(),
    limit: Joi.number(),
  }),
}

export const subscriptionSchema = {
  params: Joi.object({
    id: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    contentType: STRING_SCHEMA.valid('live', 'vod').required(),
  }),
}

export const isSubscribedSchema = subscriptionSchema

export const createCommentSchema = {
  body: Joi.object({
    message: STRING_SCHEMA.required(),
    parentType: STRING_SCHEMA.valid('vod', 'episode').required(),
    parentId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
  }),
}

export const createReplySchema = {
  body: Joi.object({
    message: STRING_SCHEMA.required(),
    parentType: STRING_SCHEMA.valid('vod', 'episode').required(),
    parentId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    parentCommentId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    parentReplyId: MONGO_DB_OBJECT_ID_SCHEMA,
  }),
}

export const updateCommentSchema = {
  body: Joi.object({
    message: STRING_SCHEMA.required(),
  }),
}

export const createRatingSchema = {
  body: Joi.object({
    parentType: STRING_SCHEMA.valid('vod', 'episode').required(),
    parentId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    rate: Joi.number().min(0).max(5).required(),
    comment: STRING_SCHEMA.optional(),
  }),
}

export const updateRatingSchema = {
  body: Joi.object({
    comment: STRING_SCHEMA.optional(),
    rate: Joi.number().min(0).max(5).optional(),
  }).or('comment', 'rate'),
}

export const viewContentSchema = {
  body: Joi.object({
    content: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    contentType: STRING_SCHEMA.valid('vod', 'episode', 'live', 'trailer').required(),
  }),
}

export const createWatchedSchema = {
  body: Joi.object({
    parentId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    parentType: STRING_SCHEMA.valid('episode', 'vod').required(),
    duration: Joi.number().min(0).required(),
    totalDuration: Joi.number().min(0).required(),
  }),
}

export const registerRecentSearchSchema = {
  body: Joi.object({
    contentId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
    contentType: STRING_SCHEMA.valid('vod', 'live').required(),
  }),
}
