import { validate } from '../../middlewares/requestValidator'
import { videoTypes } from '../../models/videos.model'
import { AdminUploadService } from '../../services/core/AdminUploadService'

import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'
import {
  AllVideoTypes,
  MovieData,
  UploadMediaUtils,
} from '../../utils/UploadMediaUtils'

import { addEpisodeSchema, createSeasonSchema } from '../../validations/admin'

export class AdminUploadController extends UploadMediaUtils {
  private static _validateVideoType = (type: string) => {
    if (!videoTypes.includes(type as any)) {
      throw new OperationalError(`Valid video types are ${videoTypes.join(' || ')} `, 400)
    }
    return type as AllVideoTypes
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
      trailer: files.trailer?.[0],
    }

    this._validateAddMovieData(type, data, files)

    sendResponse({
      res,
      message: `${type} added successfully`,
      data: await AdminUploadService.addVideo({
        type,
        data: data,
        adminId: admin.id,
      }),
    })
  })

  static addSeason = Catch.async(async ({ files: reqFiles, body, user, params }, res) => {
    const files = this._checkFiles(reqFiles)

    const _data = {
      trailerLink: body.trailerLink,
      portraitPhoto: files['portraitPhoto']?.[0],
      landscapePhoto: files['landscapePhoto']?.[0],
      trailer: files['trailer']?.[0],
    }

    validate(createSeasonSchema, _data)

    const data = { ..._data, videoId: params.videoId, adminId: GetDefined.loggedInUser(user).id }

    sendResponse({
      res,
      message: `season added successfully`,
      data: await AdminUploadService.addSeason(data),
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
        trailer: files.trailer?.[0],
        video: files.video?.[0],
      })
    }

    validate(addEpisodeSchema, data)

    sendResponse({
      res,
      message: 'episode added successfully',
      data: await AdminUploadService.addEpisode({
        seasonId: req.params.seasonId,
        adminId: GetDefined.loggedInUser(req.user).id,
        data,
      }),
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

  static fetchSeasonsAndEpisodes = Catch.async(async ({ query, params }, res) => {
    sendResponse({
      res,
      message: `seasons fetched successfully`,
      data: await AdminUploadService.getSeasonsAndEpisodes(params.vidId, query),
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
