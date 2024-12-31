import { Request } from 'express'
import { CategoryEnumRepo } from '../../repositories/CategoryEnumRepo'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'

export class CategoryEnumService {
  static addCategory = async (name: string) => {
    return await CategoryEnumRepo.create(name)
  }

  static getCategories = async (query: Request['query']) => {
    const features = new QueryParamsFeatures(CategoryEnumRepo.getAllCategories(), {
      defaultLimit: 300,
      defaultPage: 1,
      queryParams: query,
    })

    return await features.paginate().query
  }

  static deleteCategoryById = async (categoryId: string) => {
    const deletedCategory = await CategoryEnumRepo.deleteById(categoryId)

    if (deletedCategory == null) {
      throw new OperationalError('invalid categoryId', 404)
    }
  }
}
