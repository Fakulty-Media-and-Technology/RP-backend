import { Catch } from '../../utils/Catch'
import { LiveModel } from '../../models/lives.model'
import { SubtitleModel } from '../../models/subtitle.model'
import { UserModel } from '../../models/users.model'

import { genRandUniqId } from '../../utils/strGen'
import { sendResponse } from '../../utils/responder'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { VideoModel } from '../../models/videos.model'

import { MediaAccess } from '../../services/media-access'
import { MediaManagement } from '../../services/media-management'
import { MediaConvert } from '../../services/aws/mediaConvert'

export class AdminManagemediaController {
  static uploadVideo = Catch.async(async ({ file, body: { expire, fileName }, user }, res) => {
    GetDefined.loggedInUser(user)

    if (file == null) {
      throw new OperationalError('upload a video file', 400)
    }

    const expireDate = typeof expire === 'string' ? new Date(expire) : undefined
    const video = await MediaManagement.uploadVideo(file, expireDate, fileName)
    await MediaConvert.transcode(`${video.Key.replace('videos/', '')}/`)

    sendResponse({ res, data: video, message: 'video uploaded' })
  })

  static uploadImageOrSubtitle = (type: 'image' | 'subtitle') =>
    Catch.async(async ({ file, body: { fileName } }, res) => {
      const isImageUpload = type === 'image'

      if (file == null) {
        throw new OperationalError(`upload ${isImageUpload ? 'an image' : 'a subtitle'} file`, 400)
      }

      const uploader = isImageUpload ? MediaManagement.uploadImage : MediaManagement.uploadSubtitle
      const upload = await uploader(file, fileName)
      sendResponse({ res, data: upload, message: `video ${type} uploaded` })
    })

  static adminGetPhotoUrl = Catch.async(async (req, res) => {
    const { bucket, key } = req.body
    const image = await MediaAccess.getSignedUrl(bucket, key, 'photo')
    sendResponse({ res, data: image, message: 'image fetched' })
  })

  static createLive = Catch.async(async (req, res) => {
    const {
      client_id,
      title,
      sub_title,
      cover_photo,
      vid_class,
      pg,
      category,
      description,
      type,
      start,
      expiry,
      sponsored,
      popular,
      video,
      location,
    } = req.body

    if (
      !client_id ||
      !title ||
      !sub_title ||
      !cover_photo ||
      !vid_class ||
      !pg ||
      !category ||
      !description ||
      !type ||
      !sponsored ||
      !popular ||
      !start ||
      !location
    ) {
      throw new OperationalError('all important fields are required', 400)
    }

    const vclient_id = await UserModel.findOne({
      _id: client_id,
      role: { $in: ['channel', 'event', 'podcast', 'tvshow'] },
    })

    if (!vclient_id) {
      throw new OperationalError('assigned user not found', 404)
    }

    const streamId = genRandUniqId(12)

    const streamIdExist = await LiveModel.findOne({
      stream_key: streamId,
    })

    if (streamIdExist) {
      throw new OperationalError('Oops, please try again', 400)
    }

    const streamOngoing = await LiveModel.find({ client_id, active: true })

    if (streamOngoing.length > 0) {
      throw new OperationalError('client have an ongoing stream', 400)
    }

    const scheduledStream = await LiveModel.findOne({
      client_id,
      active: true,
      expired: false,
    })

    if (scheduledStream) {
      throw new OperationalError('client alrealdy have pending scheduled stream', 400)
    }

    await new LiveModel({
      client_id: vclient_id._id,
      title: title,
      sub_title: sub_title,
      stream_key: streamId,
      cover_photo: cover_photo,
      vid_class: vid_class,
      pg: pg,
      category: category,
      description: description,
      type: type,
      start: new Date(start),
      expiry: new Date(expiry),
      sponsored,
      popular,
      location,
      preview_video: video,
    }).save()

    sendResponse({
      res,
      message: 'live stream event scheduled, credentials are on attached user dashboard',
    })
  })

  static searchClient = Catch.async(async (req, res) => {
    const search = req.query.search as string

    const searchReg = new RegExp(search, 'i')

    const clients = await UserModel.find({
      role: { $in: ['channel', 'tvshow', 'event', 'podcast'] },
      $or: [
        { first_name: { $regex: searchReg } },
        { last_name: { $regex: searchReg } },
        { email: { $regex: searchReg } },
      ],
    }).select('_id first_name last_name role')

    sendResponse({
      res,
      data: clients,
      message: 'matched clients fetched',
    })
  })

  static getLivesByType = (type: 'event' | 'channel' | 'tvshow') =>
    Catch.async(async ({ query }, res) => {
      const DBQuery = LiveModel.find({ type }).select(
        '_id title pg vid_class active expiry cover_photo views',
      )

      const features = new QueryParamsFeatures(DBQuery, {
        defaultLimit: 10,
        defaultPage: 1,
        queryParams: query,
      })

      sendResponse({
        res,
        data: await features.paginate().query,
        message: `live ${type}s fecthed`,
      })
    })

  //TODO delete and edit channel
  static addSubtitle = Catch.async(async (req, res) => {
    const { vid_id, bucket, key, language, is_series } = req.body

    const vid = await VideoModel.findById(vid_id)

    if (!vid) {
      throw new OperationalError('specified video id not found', 400)
    }

    await new SubtitleModel({
      video_id: vid_id,
      bucket,
      key,
      language,
      is_series,
    }).save()

    sendResponse({
      res,
      message: 'subtitle added successfully',
    })
  })
}
