import Joi from 'joi'

export const MONGO_DB_OBJECT_ID_REG = /^[0-9A-Za-z]{24}$/
export const NUMERIC_REG = /^\d+$/
export const FLOATS_REG = /[-+]?[0-9]*\.?[0-9]+/

export const STRING_SCHEMA = Joi.string()
export const MONGO_DB_OBJECT_ID_SCHEMA = Joi.string().pattern(MONGO_DB_OBJECT_ID_REG)
export const MONGO_DB_OBJECT_ID_ARRAY_SCHEMA = Joi.array().items(MONGO_DB_OBJECT_ID_SCHEMA)
