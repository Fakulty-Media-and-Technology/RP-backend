import { CastEnumService } from '../../services/core/CastEnumService'
import { CategoryEnumService } from '../../services/core/CategoryEnumsService'
import { GenreService } from '../../services/core/GenreService'
import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'
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

  static updateGenre = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await GenreService.updateGenre(req.params.genreId, req.body),
      message: 'genre updated',
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

  static getCategories = Catch.async(async (req, res) => {
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

  static addCast = Catch.async(async ({ body, file }, res) => {
    if (file == null || !file.mimetype.startsWith('image')) {
      throw new OperationalError('Provide an image file', 400)
    }

    await CastEnumService.createCast({
      title: body.title,
      name: body.name,
      link: body.link,
      description: body.description,
      selectButtonType: body.selectButtonType,
      photoFile: file,
    })

    sendResponse({
      res,
      message: 'new unique cast added',
    })
  })

  static editCast = Catch.async(async ({ body, file, params }, res) => {
    await CastEnumService.editCast({
      castId: params.castId,
      title: body.title,
      name: body.name,
      link: body.link,
      description: body.description,
      selectButtonType: body.selectButtonType,
      photoFile: file,
    })

    sendResponse({
      res,
      message: 'cast updated successfully',
    })
  })

  static getCastById = Catch.async(async (req, res) => {
    sendResponse({
      res,
      message: 'cast fetched',
      data: await CastEnumService.getById(req.params.castId),
    })
  })

  static searchCasts = Catch.async(async (req, res) => {
    sendResponse({
      res,
      message: 'casts fetched',
      data: await CastEnumService.searchCasts(req.params.searchText, req.query),
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
