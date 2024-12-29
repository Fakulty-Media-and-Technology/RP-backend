import Joi from 'joi'
import { FLOATS_REG, MONGO_DB_OBJECT_ID_ARRAY_SCHEMA, NUMERIC_REG, STRING_SCHEMA } from './common'

const posterSchema = Joi.object({
  bucket: STRING_SCHEMA.required(),
  key: STRING_SCHEMA.required(),
  dimension: STRING_SCHEMA.valid('landscape', 'portrait').required(),
})

export const addMovieSchema = {
  body: Joi.object({
    // common
    title: STRING_SCHEMA.required(),
    key: STRING_SCHEMA.required(),
    pg: STRING_SCHEMA.pattern(NUMERIC_REG).required(),
    vid_class: STRING_SCHEMA.valid('free', 'ad', 'exclusive', 'premium').required(),
    category: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    released_date: STRING_SCHEMA.isoDate().required(),
    runtime: STRING_SCHEMA.required(),
    default_rating: STRING_SCHEMA.pattern(FLOATS_REG).required(),

    //
    poster1_data: posterSchema.required(),
    poster2_data: posterSchema.required(),

    //
    bucket: STRING_SCHEMA.required(),
    genre: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),
    cast: MONGO_DB_OBJECT_ID_ARRAY_SCHEMA.required(),

    //
    expiry_date: STRING_SCHEMA.isoDate(),
    sub_title: STRING_SCHEMA,
  }),
}
