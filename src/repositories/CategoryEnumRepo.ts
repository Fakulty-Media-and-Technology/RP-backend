import { CategoryEnumModel } from "../models/categoryEnum.model"

export class CategoryEnumRepo {
    static create = (name: string) => CategoryEnumModel.create({ name })
  
    static getAllCategories = () => CategoryEnumModel.find({})
  
    static deleteById = (id: string) => CategoryEnumModel.findByIdAndDelete(id)
  }