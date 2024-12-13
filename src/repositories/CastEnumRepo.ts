import { CastEnumModel } from "../models/castEnum.model"

export class CastEnumRepo {
    static create = (name: string, title: string) => CastEnumModel.create({ name, title })
  
    static getAllCasts = () => CastEnumModel.find({})
  
    static deleteById = (id: string) => CastEnumModel.findByIdAndDelete(id)
  }