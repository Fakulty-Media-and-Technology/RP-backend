import { CategoryEnumRepo } from "../../repositories/CategoryEnumRepo"
import { OperationalError } from "../../utils/OperationalError"

export class CategoryEnumService {
  static addCategory = async (name: string) => {
    return await CategoryEnumRepo.create(name)
  }

  static getCategories = async () => {
    return await CategoryEnumRepo.getAllCategories()
  }

  static deleteCategoryById = async (categoryId: string) => {
    const deletedCategory = await CategoryEnumRepo.deleteById(categoryId)

    if (deletedCategory == null) {
      throw new OperationalError('invalid categoryId', 404)
    }
  }
}