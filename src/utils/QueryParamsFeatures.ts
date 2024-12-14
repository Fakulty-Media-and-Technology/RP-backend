import { Query } from 'mongoose'
import { Request } from 'express'

type QueryParamsFeaturesOptions = {
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

  // value is numeric here
  return Number(val)
}

export class QueryParamsFeatures<T, U> {
  query: Query<T, U>
  private _options: QueryParamsFeaturesOptions

  constructor(query: Query<T, U>, options: QueryParamsFeaturesOptions) {
    this.query = query
    this._options = options
  }

  private _setNumDefaultNum(val: unknown, defaultNum: number) {
    return handleDefaultNumAndUnknown(val, defaultNum)
  }

  paginate() {
    const { queryParams, defaultPage = 1, defaultLimit = 50 } = this._options

    const page = this._setNumDefaultNum(queryParams.page, defaultPage)
    const limit = this._setNumDefaultNum(queryParams.limit, defaultLimit)
    const skip = (page - 1) * limit
    this.query.skip(skip).limit(limit)
    return this
  }
}
