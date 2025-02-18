import { CastEnumService } from '../../services/core/CastEnumService'
import { CategoryEnumService } from '../../services/core/CategoryEnumsService'
import { GenreService } from '../../services/core/GenreService'
import { Catch } from '../../utils/Catch'
import { sendResponse } from '../../utils/responder'

export class AdminEnumController {
  // *************** Genres
  static remGenre = Catch.async(async ({ params: { id } }, res) => {
    await GenreService.deleteGenreByNameOrId('_id', id)

    sendResponse({
      res,
      message: 'genre deleted',
    })
  })

  static getGenres = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await GenreService.getGenres(req.query),
      message: 'generes fetched',
    })
  })

  static addGenre = Catch.async(async ({ body: { name, position } }, res) => {
    await GenreService.create(name, position)

    sendResponse({
      res,
      message: 'new unique genre added',
    })
  })

  // ********** Category *******

  static addCategory = Catch.async(async ({ body: { name, position } }, res) => {
    await CategoryEnumService.addCategory(name, position)

    sendResponse({
      res,
      message: 'new unique category added',
    })
  })

  static getCategory = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await CategoryEnumService.getCategories(req.query),
      message: 'categories fetched',
    })
  })

  static updateCategory = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await CategoryEnumService.updateCategory(req.params.catId, req.body),
      message: 'category updated',
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

  static getCast = Catch.async(async (req, res) => {
    sendResponse({
      res,
      message: 'casts fetched',
      data: await CastEnumService.getCasts(req.query),
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
