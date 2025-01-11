import Joi from 'joi'
import { PHOTO_SCHEMA_WITH_CONTENT_TYPE, STRING_SCHEMA } from './common'

export const updateProfileSchema = {
  body: Joi.object({
    first_name: STRING_SCHEMA,
    last_name: STRING_SCHEMA,
    country_code: STRING_SCHEMA,
    mobile: STRING_SCHEMA,
    photo: PHOTO_SCHEMA_WITH_CONTENT_TYPE,
  }),
}
