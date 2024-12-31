import { Request } from 'express'
import { CastEnumRepo } from '../../repositories/CastEnumRepo'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'

export class CastEnumService {
  static createCast = async (name: string, title: string) => {
    return await CastEnumRepo.create(name, title)
  }

  static getCasts = async (query: Request['query']) => {
    const features = new QueryParamsFeatures(CastEnumRepo.getAllCasts(), {
      defaultLimit: 300,
      defaultPage: 1,
      queryParams: query,
    })

    return await features.paginate().query
  }

  static deleteById = async (castId: string) => {
    const deletedCast = await CastEnumRepo.deleteById(castId)

    if (deletedCast == null) {
      throw new OperationalError('invalid cast Id', 404)
    }
  }
}
