import { LiveModel, LiveSchema } from '../../models/lives.model'
import { SubtitleModel } from '../../models/subtitle.model'
import { UserModel } from '../../models/users.model'

import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { VideoModel } from '../../models/videos.model'

import { MediaAccess } from '../../services/media-access'
import { MediaManagement } from '../../services/media-management'
import { MediaConvert } from '../../services/aws/mediaConvert'
import { Request } from 'express'
import { UserRepo } from '../../repositories/UserRepo'
import { getUniqueStreamKey } from '../../utils/live'
import { rimraf } from 'rimraf'

export type UploadImageOrSubtitleType = 'image' | 'subtitle'

export type LivesType = Extract<LiveSchema['type'], 'event' | 'channel' | 'tvshow'>

type UploadVideoInput = {
  file: Express.Multer.File | undefined
  expire: string | undefined
  fileName?: string
}

type UploadImageOrSubtitleInput = Pick<UploadVideoInput, 'file' | 'fileName'> & {
  type: UploadImageOrSubtitleType
}

export class AdminManageMediaService {
  static uploadVideo = async ({ file, expire, fileName }: UploadVideoInput) => {
    if (file == null) {
      throw new OperationalError('upload a video file', 400)
    }

    const expireDate = typeof expire === 'string' ? new Date(expire) : undefined
    const video = await MediaManagement.uploadVideo(file, expireDate, fileName)

    rimraf(file.path).catch(_ =>
      console.error('🛑 error deleting ', +file.filename + ' from tempMedia folder'),
    )

    await MediaConvert.transcode(`${video.Key.replace('videos/', '')}/`)

    return {
      ...video,
      s3_res: undefined,
    }
  }

  static uploadPhotoOrSubtitle = async ({ file, fileName, type }: UploadImageOrSubtitleInput) => {
    if (file == null) {
      throw new OperationalError(`upload a ${type === 'image' ? 'photo' : 'subtitle'} file`, 400)
    }

    const upload = await MediaManagement.uploadImageOrSubtitle({
      file,
      fileName,
      type,
    })

    return upload
  }

  static getPhotoUrl = async (bucket: string, key: string) => {
    const imageURL = await MediaAccess.getSignedUrl(bucket, key, 'photo')
    return imageURL
  }

  static getLivesByType = async (type: LivesType, query: Request['query']) => {
    const DBQuery = LiveModel.find({ type }).select(
      '_id title pg type vid_class active expiry cover_photo views',
    )

    const features = new QueryParamsFeatures(DBQuery, {
      defaultLimit: 10,
      defaultPage: 1,
      queryParams: query,
    })

    const lives = await features.paginate().query
    return lives
  }

  static addSubtitle = async (data: Record<string, any>) => {
    const { vid_id, bucket, key, language, is_series } = data

    const vid = await VideoModel.findById(vid_id)

    if (!vid) {
      throw new OperationalError('specified video id not found', 400)
    }

    await SubtitleModel.create({
      video_id: vid_id,
      bucket,
      key,
      language,
      is_series,
    })
  }

  static createLive = async (data: Record<string, any>) => {
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
    } = data

    const vclient_id = await UserModel.findOne({
      _id: client_id,
      role: { $in: ['channel', 'event', 'podcast', 'tvshow'] },
    })

    if (!vclient_id) {
      throw new OperationalError('assigned user not found', 404)
    }

    const streamOngoing = await LiveModel.find({ client_id, active: true })

    if (streamOngoing.length > 0) {
      throw new OperationalError('client has an ongoing stream', 400)
    }

    const scheduledStream = await LiveModel.findOne({
      client_id,
      active: true,
      expired: false,
    })

    if (scheduledStream) {
      throw new OperationalError('client alrealdy have pending scheduled stream', 400)
    }

    await LiveModel.create({
      client_id: vclient_id._id,
      title: title,
      sub_title: sub_title,
      stream_key: await getUniqueStreamKey(),
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
    })
  }

  static searchClient = async (searchText: string, query: Request['query']) => {
    const searchReg = new RegExp(searchText, 'i')

    const features = new QueryParamsFeatures(UserRepo.searchUsersByRegexQuery(searchReg), {
      defaultLimit: 200,
      defaultPage: 1,
      queryParams: query,
    })

    const clients = await features.paginate().query
    return clients
  }
}
