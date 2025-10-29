import { Video, videoTypes } from '../models/videos.model'
import { OperationalError } from '../utils/OperationalError'

import {
  MediaManagement,
  StoreResponse,
  UploadAndTranscodeConfig,
} from './../services/media-management'
import { MulterFile, StringOrObjectId } from '../types'
import { videoUploadParents } from '../models/assets'

import { addSeriesSchema, addMovieOrSkitSchema, addMusicVideoSchema } from '../validations/admin'
import { validate } from '../middlewares/requestValidator'

import { ValidCurrency } from './currency'
import { VideoUploadModel } from '../models/videoupload.model'

type RequestFiles =
  | {
      [fieldname: string]: MulterFile[]
    }
  | MulterFile[]
  | undefined

export type AllVideoTypes = Video['type']

export type EpisodeReqData = {
  title: string
  description?: string
  videoLink?: string
  trailerLink?: string
  subTitleLanguage?: string
  subTitle?: MulterFile
  video?: MulterFile
  trailer?: MulterFile
}

export type AddEpisodeInput = {
  seasonId: string
  data: EpisodeReqData
  adminId: string
}

export type UploadVideoAndTrailerInput = {
  data: AddVideoParams['data']
  videoDoc: Video
}

export type MovieData = {
  title: string
  pg: string
  description: string
  vidClass: Video['vidClass']
  primaryColor: string

  defaultRating?: string
  videoLink?: string
  trailerLink?: string
  runtime?: string
  expiryDate?: string
  releasedDate: string
  artistName?: string

  amount?: number
  currency?: ValidCurrency

  active?: boolean
  showViews?: boolean

  category?: string[]
  genre?: string[]
  cast?: string[]

  //files
  landscapePoster: MulterFile
  portraitPoster: MulterFile
  trailer?: MulterFile
  video?: MulterFile
}

export type AddSeasonParams = {
  adminId: string
  videoId: string
  description?: string
}

export type AddVideoParams = {
  data: MovieData
  type: AllVideoTypes
  adminId: string
}

export type EditVideoParams = Pick<AddVideoParams, 'adminId'> & {
  data: Partial<MovieData> & { upcoming?: boolean }
  videoId: string
}

export type SavePostersUploadToDBParams = {
  portraitPosterUpload: StoreResponse
  landscapePosterUpload: StoreResponse
  videoId: StringOrObjectId
  posterParentType: 'vod' | 'live' | 'season' | 'episode' | 'upcoming'
}

export type UploadAndSavePostersToDBParams = Pick<
  SavePostersUploadToDBParams,
  'videoId' | 'posterParentType'
> & {
  portraitFile: MulterFile
  landscapeFile: MulterFile
}

export type GetVideoUploadDoc = UploadAndTranscodeConfig & {
  parentType: (typeof videoUploadParents)[number]
  parentId: StringOrObjectId
}

export type UploadTrailerAndVIdeoInput = {
  file: MulterFile
  expire: Date | undefined
  parentId: StringOrObjectId
  parentType: (typeof videoUploadParents)[number]
}

export class UploadMediaUtils {
  static validateAddMovieData = (type: AllVideoTypes, data: MovieData, files: any) => {
    if (type === 'series') {
      validate(addSeriesSchema, data)
      return
    }

    Object.assign(data, {
      ...data,
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

  static checkFiles = (files?: RequestFiles) => {
    if (files == null) {
      throw new OperationalError('expected at least one file', 400)
    }

    if (Array.isArray(files)) {
      throw new OperationalError('expected multiple files as an object', 400)
    }

    return files
  }

  static allowMimetype = (file: MulterFile, type: 'image' | 'video' | 'text', msg: string) => {
    if (!file.mimetype.startsWith(type)) {
      throw new OperationalError(msg, 400)
    }
  }

  static _validateAddVideoFileTypes = (data: AddVideoParams['data'] | EditVideoParams['data']) => {
    data.portraitPoster &&
      this.allowMimetype(data.portraitPoster, 'image', 'portraitPoster must be an image')
    data.landscapePoster &&
      this.allowMimetype(data.landscapePoster, 'image', 'landscapePoster must be an image')
    data.trailer && this.allowMimetype(data.trailer, 'video', ' trailer must be a video file')
    data.video && this.allowMimetype(data.video, 'video', 'video must be a video file')
  }

  static getVideoUploadDocument = (upload: StoreResponse) => {
    const videoUploadDocument = new VideoUploadModel({
      bucket: upload.Bucket,
      key: upload.Key,
      mimetype: upload.mimetype,
      size: upload.size,
      isTranscoded: false,
    })

    return videoUploadDocument
  }
}
