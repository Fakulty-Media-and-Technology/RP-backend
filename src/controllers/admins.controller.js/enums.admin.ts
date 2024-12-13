import { CastEnumService } from '../../services/core/CastEnumService'
import { CategoryEnumService } from '../../services/core/CategoryEnumsService'
import { GenreService } from '../../services/core/GenreService'
import { Catch } from '../../utils/catchAsync'
import { sendResponse } from '../../utils/responder'

export class EnumController {
  // *************** Genres
  static remGenre = Catch.async(async ({ params: { id } }, res) => {
    await GenreService.deleteGenreByNameOrId('_id', id)

    sendResponse({
      res,
      message: 'genre deleted',
    })
  })

  static getGenres = Catch.async(async (_, res) => {
    sendResponse({
      res,
      data: await GenreService.getGenres(),
      message: 'new unique genre added',
    })
  })

  static addGenre = Catch.async(async ({ body: { name } }, res) => {
    await GenreService.create(name)

    sendResponse({
      res,
      message: 'new unique genre added',
    })
  })

  // ********** Category *******

  static addCategory = Catch.async(async ({ body: { name } }, res) => {
    await CategoryEnumService.addCategory(name)

    sendResponse({
      res,
      message: 'new unique category added',
    })
  })

  static getCategory = Catch.async(async (_, res) => {
    sendResponse({
      res,
      data: await CategoryEnumService.getCategories(),
      message: 'categories fetched',
    })
  })

  static remCategory = Catch.async(async ({ params: { id } }, res) => {
    await CategoryEnumService.deleteCategoryById(id)

    sendResponse({
      res,
      message: 'category deleted',
    })
  })

  // *************** Casts

  static addCast = Catch.async(async ({ body: { name, title } }, res) => {
    await CastEnumService.createCast(name, title)

    sendResponse({
      res,
      message: 'new unique cast added',
    })
  })

  static getCast = Catch.async(async (_, res) => {
    sendResponse({
      res,
      message: 'casts fetched',
      data: await CastEnumService.getCasts(),
    })
  })

  static remcast = Catch.async(async ({ params: { id } }, res) => {
    await CastEnumService.deleteById(id)

    sendResponse({
      res,
      message: 'cast deleted',
    })
  })
}
