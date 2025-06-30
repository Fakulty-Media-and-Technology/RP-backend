import { Query } from 'mongoose'
import { Request } from 'express'

export type ExpressRequestQuery = Request['query']

export type QueryParamsFeaturesOptions = {
  queryParams: ExpressRequestQuery
  defaultPage?: number
  defaultLimit?: number
}

export const guranteeNumericResult = (val: unknown, defaultNum: number) => {
  if (typeof val !== 'string') {
    return defaultNum
  }

  const num = Number(val)

  return Number.isNaN(num) || num <= 0 ? defaultNum : num
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

    const page = guranteeNumericResult(queryParams.page, defaultPage)
    const limit = guranteeNumericResult(queryParams.limit, defaultLimit)
    this.query.skip(skip(page, limit)).limit(limit)
    return this
  }

  static paginagteParams = (queryParams: ExpressRequestQuery) => {
    const page = guranteeNumericResult(queryParams.page, 1)
    const limit = guranteeNumericResult(queryParams.limit, 10)

    return {
      page,
      limit,
      skip: skip(page, limit),
    }
  }
}
