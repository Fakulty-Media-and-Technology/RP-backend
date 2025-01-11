import { Request } from 'express'
import { CategoryEnumRepo } from '../../repositories/CategoryEnumRepo'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { CategoryEnumModel } from '../../models/categoryEnum.model'

export class CategoryEnumService {
  static addCategory = async (name: string, position: number) => {
    const category = await CategoryEnumModel.create({
      name,
      position,
    })

    return category
  }

  static updateCategory = async (catId: string, data: Record<string, any>) => {
    const updatedCategory = await CategoryEnumModel.findByIdAndUpdate(catId, data, { new: true })

    if (updatedCategory == null) {
      throw new OperationalError('category id is invalid', 404)
    }

    return updatedCategory
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
