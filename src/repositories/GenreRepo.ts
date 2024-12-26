import { GenreEnumModel } from '../models/genreEnum.model'

export type DeleteType = '_id' | 'name'

export class GenreRepo {
  static create = (name: string) => GenreEnumModel.create({ name })

  static getAllGenres = () => GenreEnumModel.find({})

  static deleteGenre = (type: DeleteType, val: string) => {
    return GenreEnumModel.findOneAndDelete({ [type]: val })
  }
}
