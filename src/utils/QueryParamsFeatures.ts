import { Query } from 'mongoose'
import { Request } from 'express'
import { OperationalError } from './OperationalError'

export type QueryParamsFeaturesOptions = {
  queryParams: Request['query']
  defaultPage?: number
  defaultLimit?: number
}

export const handleDefaultNumAndUnknown = (val: unknown, defaultNum: number) => {
  if (typeof val !== 'string') {
    return defaultNum
  }

  if (/^[0-9]+$/.test(val) === false) {
    return defaultNum
  }

  const num = Number(val)

  if (num <= 0) {
    throw new OperationalError('pagination values cannot be less than or equal zero', 400)
  }

  return num
}

export const skip = (page: number, limit: number) => (page - 1) * limit

export class QueryParamsFeatures<T, U> {
  query: Query<T, U>
  private _options: QueryParamsFeaturesOptions

  constructor(query: Query<T, U>, options: QueryParamsFeaturesOptions) {
    this.query = query
    this._options = options
  }

  paginate() {
    const { queryParams, defaultPage = 1, defaultLimit = 50 } = this._options

    const page = handleDefaultNumAndUnknown(queryParams.page, defaultPage)
    const limit = handleDefaultNumAndUnknown(queryParams.limit, defaultLimit)
    this.query.skip(skip(page, limit)).limit(limit)
    return this
  }
}
