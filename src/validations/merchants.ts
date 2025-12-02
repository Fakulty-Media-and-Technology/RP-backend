import Joi from 'joi'
import { STRING_SCHEMA } from './common'

export const createMerchantSchema = {
  body: Joi.object({
    email: STRING_SCHEMA.email().required(),
    password: STRING_SCHEMA.required(),
  }).required(),
}
