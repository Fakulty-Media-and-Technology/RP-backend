import { validate } from '../../middlewares/requestValidator'
import {
  AdminUploadService,
  AllVideoTypes,
  MovieData,
} from '../../services/core/AdminUploadService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'
import {
  addEpisodeSchema,
  addMovieOrSkitSchema,
  addMusicVideoSchema,
  addSeriesSchema,
} from '../../validations/admin'

type RequestFiles =
  | {
      [fieldname: string]: Express.Multer.File[]
    }
  | Express.Multer.File[]
  | undefined

const checkFiles = (files?: RequestFiles) => {
  if (files == null) {
    throw new OperationalError('expected at least one file', 400)
  }

  if (Array.isArray(files)) {
    throw new OperationalError('expected multiple files as an object', 400)
  }

  return files
}

export class AdminUploadController {
  static addSeason = Catch.async(async (req, res) => {
    sendResponse({
      res,
      message: `season added successfully`,
      data: await AdminUploadService.addSeason(
        req.params.videoId,
        GetDefined.loggedInUser(req.user).id,
      ),
    })
  })

  static addEpisode = Catch.async(async (req, res) => {
    if (req.body.data == null || typeof req.body.data !== 'string') {
      throw new OperationalError(
        'formData.data is required and must be a JSON serialized string',
        400,
      )
    }

    const data = {
      ...JSON.parse(req.body.data),
    }

    if (!!req.files) {
      const files = checkFiles(req.files)

      Object.assign(data, {
        subTitle: files.subTitle?.[0],
        trailer: files.trailer?.[0],
        video: files.video?.[0],
      })
    }

    validate(addEpisodeSchema, data)

    await AdminUploadService.addEpisode({
      seasonId: req.params.seasonId,
      adminId: GetDefined.loggedInUser(req.user).id,
      data,
    })

    sendResponse({
      res,
      message: 'episode added successfully',
    })
  })

  private static _validateAddMovieData = (type: AllVideoTypes, data: MovieData, files: any) => {
    if (type === 'series') {
      validate(addSeriesSchema, data)
      return
    }

    Object.assign(data, {
      ...data,
      subTitle: files.subTitle?.[0],
      trailer: files.trailer?.[0],
      video: files.video?.[0],
    })

    switch (type) {
      case 'movie':
        validate(addMovieOrSkitSchema, data)
        break

      case 'skit':
        validate(addMovieOrSkitSchema, data)
        break

      case 'music video':
        validate(addMusicVideoSchema, data)
        break

      default:
        const validTypes: Array<AllVideoTypes> = ['movie', 'music video', 'series', 'skit']
        throw new OperationalError(`Valid movie types are ${validTypes.join(' || ')} `, 400)
    }
  }

  static addVideoByType = (type: AllVideoTypes) =>
    Catch.async(async ({ files: reqFiles, body, user }, res) => {
      const admin = GetDefined.loggedInUser(user)

      const { data: _data } = body

      if (_data == null || typeof _data !== 'string') {
        throw new OperationalError(
          'formData.data is required and must be a JSON serialized string',
          400,
        )
      }

      const files = checkFiles(reqFiles)

      if (Object.keys(files).length === 0) {
        throw new OperationalError('Expected at least one file', 400)
      }

      const data: MovieData = {
        ...JSON.parse(body.data),
        landscapePoster: files.landscapePoster?.[0],
        portraitPoster: files.portraitPoster?.[0],
      }

      this._validateAddMovieData(type, data, files)

      await AdminUploadService.addVideo({
        type,
        data: data,
        adminId: admin.id,
      })

      sendResponse({
        res,
        message: `${type} added successfully`,
      })
    })

  static editVideoByType = (type: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      const updatedVid = await AdminUploadService.editVideo({
        vidId: req.params.id,
        changes: req.body,
        type,
      })

      sendResponse({
        res,
        data: updatedVid,
        message: `${type} edited successfully`,
      })
    })

  static fetchVideosByType = (type: AllVideoTypes) =>
    Catch.async(async ({ query }, res) => {
      sendResponse({
        res,
        message: `${type}s fetched successfully`,
        data: await AdminUploadService.getVideos(type, query),
      })
    })

  static deleteVideoByType = (type: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      await AdminUploadService.deleteVideo(req.params.id, type)

      sendResponse({
        res,
        message: `${type} deleted successfully`,
      })
    })
}
