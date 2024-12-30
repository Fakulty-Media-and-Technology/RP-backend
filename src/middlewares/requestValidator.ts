import Joi from 'joi'
import { Catch } from '../utils/Catch'
import { OperationalError } from '../utils/OperationalError'

const pickObject = (obj: Record<string, any>, keys: string[]) => {
  const hasOwn = Object.prototype.hasOwnProperty.bind(obj)

  const picked: Record<string, any> = {}

  for (const key of keys) {
    if (hasOwn(key)) {
      picked[key] = obj[key]
    }
  }

  return picked
}

export const requestValidator = (schema: Record<string, Joi.Schema>) =>
  Catch.sync((req, _, next) => {
    const validSchema = pickObject(schema, ['body', 'params', 'query'])
    const pickedReq = pickObject(req, Object.keys(validSchema))

    const { error } = Joi.compile(validSchema).validate(pickedReq)

    if (error) {
      return next(new OperationalError(error.details.map(detail => detail.message).join(' '), 400))
    }

    next()
  })
