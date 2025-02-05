import { validate } from '../../middlewares/requestValidator'
import { videoTypes } from '../../models/videos.model'
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

export class AdminUploadController {
  private static _checkFiles = (files?: RequestFiles) => {
    if (files == null) {
      throw new OperationalError('expected at least one file', 400)
    }

    if (Array.isArray(files)) {
      throw new OperationalError('expected multiple files as an object', 400)
    }

    return files
  }

  private static _validateVideoType = (type: string) => {
    if (!videoTypes.includes(type as any)) {
      throw new OperationalError(`Valid video types are ${videoTypes.join(' || ')} `, 400)
    }
    return type as AllVideoTypes
  }

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

      case 'music-video':
        validate(addMusicVideoSchema, data)
        break

      default:
        throw new OperationalError(`Valid movie types are ${videoTypes.join(' || ')} `, 400)
    }
  }

  static addVideo = Catch.async(async ({ files: reqFiles, body, user, params }, res) => {
    const type = this._validateVideoType(params.type)
    const admin = GetDefined.loggedInUser(user)

    const { data: _data } = body

    if (_data == null || typeof _data !== 'string') {
      throw new OperationalError(
        'formData.data is required and must be a JSON serialized string',
        400,
      )
    }

    const files = this._checkFiles(reqFiles)

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
      const files = this._checkFiles(req.files)

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

  static editVideo = Catch.async(async ({ params, body }, res) => {
    const type = this._validateVideoType(params.type)

    const updatedVid = await AdminUploadService.editVideo({
      vidId: params.id,
      changes: body,
      type,
    })

    sendResponse({
      res,
      data: updatedVid,
      message: `${type} edited successfully`,
    })
  })

  static fetchVideos = Catch.async(async ({ query, params }, res) => {
    const type = this._validateVideoType(params.type)

    sendResponse({
      res,
      message: `${type}s fetched successfully`,
      data: await AdminUploadService.getVideos(type, query),
    })
  })

  static deleteVideo = Catch.async(async ({ params }, res) => {
    const type = this._validateVideoType(params.type)

    await AdminUploadService.deleteVideo(params.id, type)

    sendResponse({
      res,
      message: `${type} deleted successfully`,
    })
  })
}
