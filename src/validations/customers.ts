import Joi from 'joi'
import { MONGO_DB_OBJECT_ID_SCHEMA, STRING_SCHEMA } from './common'

export const createCommentSchema = {
  body: Joi.object({
    message: STRING_SCHEMA.required(),
    parentType: STRING_SCHEMA.valid('vod', 'episode').required(),
    parentId: MONGO_DB_OBJECT_ID_SCHEMA.required(),
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
