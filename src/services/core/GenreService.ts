import { DeleteType, GenreRepo } from '../../repositories/GenreRepo'
import { OperationalError } from '../../utils/OperationalError'

export class GenreService {
  static create = async (name: string) => {
    await GenreRepo.create(name)
  }

  static getGenres = async () => {
    return await GenreRepo.getAllGenres()
  }

  static deleteGenreByNameOrId = async (type: DeleteType, val: string) => {
    const deletedGenre = await GenreRepo.deleteGenre(type, val)

    if (deletedGenre === null) {
      throw new OperationalError('Invalid genre', 404)
    }
  }
}
