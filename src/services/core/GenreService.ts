import { Request } from 'express'
import { DeleteType, GenreRepo } from '../../repositories/GenreRepo'

import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { GenreEnumModel } from '../../models/genreEnum.model'

export class GenreService {
  static create = async (name: string, position: number) => {
    await GenreRepo.create({
      name,
      position,
    })
  }

  static updateGenre = async (genreId: string, data: Record<string, any>) => {
    const updatedGenre = await GenreEnumModel.findByIdAndUpdate(genreId, data, { new: true })

    if (updatedGenre == null) {
      throw new OperationalError('genre id is invalid', 404)
    }

    return updatedGenre
  }

  static getGenres = async (query: Request['query']) => {
    const features = new QueryParamsFeatures(GenreRepo.getAllGenres(), {
      defaultLimit: 300,
      defaultPage: 1,
      queryParams: query,
    })

    return await features.paginate().query
  }

  static deleteGenreByNameOrId = async (type: DeleteType, val: string) => {
    const deletedGenre = await GenreRepo.deleteGenre(type, val)

    if (deletedGenre === null) {
      throw new OperationalError('Invalid genre', 404)
    }
  }
}
