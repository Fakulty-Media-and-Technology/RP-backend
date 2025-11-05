import { Video, VideoModel, videoTypes } from '../../models/videos.model'
import { OperationalError } from '../../utils/OperationalError'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'

import {
  AddEpisodeUtilAggrRes,
  AddSeasonUtilAggrRes,
  toObjectId,
  VideoRepo,
} from '../../repositories/VideoRepo'

import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'

import {
  guranteeNumericResult,
  QueryParamsFeatures,
  QueryParamsFeaturesOptions,
} from '../../utils/QueryParamsFeatures'

import { Purge } from '../../utils/Purge'
import { SeasonModel } from '../../models/seasons.model'
import { Types } from 'mongoose'
import { MediaManagement, UploadAndTranscodeConfig } from '../media-management'
import { EpisodeModel } from '../../models/episodes.model'
import { MulterFile, StringOrObjectId } from '../../types'
import { validate } from '../../middlewares/requestValidator'
import { videoUploadParents } from '../../models/assets'
import { ValidCurrency } from '../../utils/currency'
import { addSeriesSchema, addMovieOrSkitSchema, addMusicVideoSchema } from '../../validations/admin'
import { UploadMediaUtils } from '../../utils/UploadMediaUtils'

export class AdminUploadService {
  static resolveWithMediaSources = (queryParams: QueryParamsFeaturesOptions['queryParams']) =>
    queryParams.withMediaSources === 'true'

  protected static _validateAddMovieData = (type: AllVideoTypes, data: MovieData, files: any) => {
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

  protected static _uploadVideoPosters = async (
    portraitFile: MulterFile,
    landscapeFile: MulterFile,
    expire?: Date,
  ) => {
    const [portraitUpload, landscapeUpload] = await Promise.all([
      MediaManagement.storeImage(portraitFile, expire),
      MediaManagement.storeImage(landscapeFile, expire),
    ])

    return {
      portraitUpload,
      landscapeUpload,
    }
  }

  static _validateAddVideoFileTypes = (data: AddVideoParams['data'] | EditVideoParams['data']) => {
    data.portraitPoster &&
      UploadMediaUtils.allowMimetype(
        data.portraitPoster,
        'image',
        'portraitPoster must be an image',
      )

    data.landscapePoster &&
      UploadMediaUtils.allowMimetype(
        data.landscapePoster,
        'image',
        'landscapePoster must be an image',
      )

    data.trailer &&
      UploadMediaUtils.allowMimetype(data.trailer, 'video', ' trailer must be a video file')

    data.video && UploadMediaUtils.allowMimetype(data.video, 'video', 'video must be a video file')
  }

  static _validateWithMovieAndPrevSeasonsAggrResult = (
    aggregateResponse: (undefined | AddSeasonUtilAggrRes)[],
  ) => {
    const result = aggregateResponse[0]

    if (result == null) {
      throw new OperationalError('invalid videoId', 404)
    }

    if (!result.isMovieSeries) {
      throw new OperationalError('movie is not a series', 403)
    }

    if (result.totalPreviousSeasons > 0 && result.totalEpisodesOfLastSeason === 0) {
      throw new OperationalError('Last Season must have at least one Episode', 403)
    }

    if (result.movieExpiryDate && new Date() > result.movieExpiryDate) {
      throw new OperationalError('Movie has expired', 403)
    }

    return result
  }

  static _validateWithSeasonAndPrevEpisodes = (aggrRes: AddEpisodeUtilAggrRes[]) => {
    if (aggrRes.length == 0) {
      throw new OperationalError('invalid season Id', 404)
    }

    const [
      {
        previousEpisodeTrailerLink,
        previousEpisodeVideoLink,
        isLastEpisodeTrailerReady,
        isLastEpisodeVideoReady,
        totalPreviousEpisodes,
      },
    ] = aggrRes

    if (totalPreviousEpisodes === 0) return

    if (previousEpisodeTrailerLink === null && isLastEpisodeTrailerReady === false) {
      throw new OperationalError("Last Episode's trailer is still processing", 403)
    }

    if (previousEpisodeVideoLink === null && isLastEpisodeVideoReady === false) {
      throw new OperationalError("Last Episode's video is still processing", 403)
    }
  }

  protected static _getVideoDocument = ({ data, type, adminId }: AddVideoParams) => {
    const videoDoc = new VideoModel({
      type,
      adminId: adminId,
      title: data.title,
      primaryColor: data.primaryColor,
      description: data.description,
      vidClass: data.vidClass,
      artistName: data.artistName,
      pg: data.pg,
      amount: data.amount,
      genre: data.genre ?? [],
      category: data.category ?? [],
      cast: data.cast ?? [],
      defaultRating: data.defaultRating,
      releaseDate: data.releasedDate,
      expiryDate: data.expiryDate,
      videoLink: data.videoLink,
      trailerLink: data.trailerLink,
      runtime: data.runtime,
      currency: data.currency,
      active: data.active,
      showViews: data.showViews,
    })

    return videoDoc
  }

  protected static _checkCanUploadVideo = (incomingData: AddVideoParams['data']) => {
    this._validateAddVideoFileTypes(incomingData)

    if (incomingData.vidClass === 'exclusive' && incomingData.amount == null) {
      throw new OperationalError('amount is required when video class is exclusive', 400)
    }
  }

  static _uploadVideoSession = async (params: AddVideoParams, session: MaybeSession) => {
    this._checkCanUploadVideo(params.data)
    const videoDocument = this._getVideoDocument(params)
    const expiry = videoDocument.expiryDate ?? undefined

    const posterUploads = await this._uploadVideoPosters(
      params.data.portraitPoster,
      params.data.landscapePoster,
      expiry,
    )

    videoDocument.landscapePhoto = {
      Bucket: posterUploads.landscapeUpload.Bucket,
      Key: posterUploads.landscapeUpload.Key,
    }

    videoDocument.portraitPhoto = {
      Bucket: posterUploads.portraitUpload.Bucket,
      Key: posterUploads.portraitUpload.Key,
    }

    if (params.data.trailer) {
      const trailerUpload = await MediaManagement.uploadAndInitiateMediaConvert(
        params.data.trailer,
        expiry,
      )

      const tVideoUploadDocument = UploadMediaUtils.getVideoUploadDocument(trailerUpload)
      tVideoUploadDocument.parentId = videoDocument._id
      tVideoUploadDocument.parentType = 'vod-trailer'
      await tVideoUploadDocument.save({ session })
      videoDocument.isTrailerReady = false
      videoDocument.trailerUpload = tVideoUploadDocument._id
    }

    if (params.data.video) {
      const videoUpload = await MediaManagement.uploadAndInitiateMediaConvert(
        params.data.video,
        expiry,
      )

      const videoUploploadDocument = UploadMediaUtils.getVideoUploadDocument(videoUpload)
      videoUploploadDocument.parentId = videoDocument._id
      videoUploploadDocument.parentType = 'vod'
      await videoUploploadDocument.save({ session })
      videoDocument.isVideoReady = false
      videoDocument.videoUpload = videoUploploadDocument._id
    }

    await videoDocument.save({ session })
    return videoDocument
  }

  static addVideo = async (input: AddVideoParams) =>
    await withMongoDBSession(this._uploadVideoSession, input)

  static addSeason = async ({ videoId, adminId, description }: AddSeasonParams) => {
    const aggrRes = this._validateWithMovieAndPrevSeasonsAggrResult(
      await VideoRepo.addSeasonUtilAggr(videoId),
    )

    return await SeasonModel.create({
      description,
      admin: adminId,
      video: videoId,
      serial_number: aggrRes.totalPreviousSeasons + 1,
    })
  }

  static canAddSeason = async (videoId: string) => {
    const aggrRes = await VideoRepo.addSeasonUtilAggr(videoId)
    this._validateWithMovieAndPrevSeasonsAggrResult(aggrRes)
  }

  static canAddEpisode = async (seasonId: string) => {
    const aggrUtilsRes = await VideoRepo.addEpisodeUtilAggr(seasonId)
    this._validateWithSeasonAndPrevEpisodes(aggrUtilsRes)
  }

  static addEpisode = async (input: AddEpisodeInput) =>
    await withMongoDBSession(this._addEpisodesWithSession, input)

  static _addEpisodesWithSession = async (
    { seasonId, data, adminId }: AddEpisodeInput,
    session: MaybeSession,
  ) => {
    data.subTitle &&
      UploadMediaUtils.allowMimetype(data.subTitle, 'text', 'subTitle must be a text file')
    data.trailer &&
      UploadMediaUtils.allowMimetype(data.trailer, 'video', ' trailer must be a video file')
    data.video && UploadMediaUtils.allowMimetype(data.video, 'video', 'video must be a video file')

    const aggrUtilsRes = await VideoRepo.addEpisodeUtilAggr(seasonId)
    this._validateWithSeasonAndPrevEpisodes(aggrUtilsRes)

    const episodeDocument = new EpisodeModel({
      title: data.title,
      description: data.description,
      episodeNumber: aggrUtilsRes[0].totalPreviousEpisodes + 1,
      trailerLink: data.trailerLink,
      videoLink: data.videoLink,
      season: seasonId,
      admin: adminId,
    })

    if (data.trailer) {
      const trailerUpload = await MediaManagement.uploadAndInitiateMediaConvert(data.trailer)
      const videoUploadDocument = UploadMediaUtils.getVideoUploadDocument(trailerUpload)
      videoUploadDocument.parentId = episodeDocument._id
      videoUploadDocument.parentType = 'episode-trailer'
      episodeDocument.trailerUpload = videoUploadDocument._id
      episodeDocument.isTrailerReady = false
      videoUploadDocument.save({ session })
    }

    if (data.video) {
      const videoUpload = await MediaManagement.uploadAndInitiateMediaConvert(data.video)
      const videoUploadDocument = UploadMediaUtils.getVideoUploadDocument(videoUpload)
      videoUploadDocument.parentId = episodeDocument._id
      videoUploadDocument.parentType = 'episode'
      episodeDocument.videoUpload = videoUploadDocument._id
      episodeDocument.isVideoReady = false
      videoUploadDocument.save({ session })
    }

    // await this._uploadEpisodeVideos({ data, episode }, session)
    await episodeDocument.save({ session })
    return episodeDocument
  }

  static editVideo = async (input: EditVideoParams) =>
    await withMongoDBSession(this._editVideoSession, input)

  static _editVideoSession = async (
    { data, adminId, videoId }: EditVideoParams,
    session: MaybeSession,
  ) => {
    this._validateAddVideoFileTypes(data)
    const videoDocument = await VideoModel.findById(videoId)

    if (videoDocument == null) {
      throw new OperationalError('invalid video id', 404)
    }

    videoDocument.description = data.description || videoDocument.description
    videoDocument.amount = data.amount || videoDocument.amount
    videoDocument.title = data.title || videoDocument.title
    videoDocument.primaryColor = data.primaryColor || videoDocument.primaryColor
    videoDocument.upcoming = data.upcoming || videoDocument.upcoming
    videoDocument.adminId = toObjectId(adminId)
    videoDocument.description = data.description || videoDocument.description
    videoDocument.vidClass = (data.vidClass as any) || videoDocument.vidClass
    videoDocument.artistName = data.artistName || videoDocument.artistName
    videoDocument.pg = data.pg || videoDocument.pg

    const addToSet = (prevs: Types.ObjectId[] | undefined | null, additions: string[]) => {
      if (!prevs) return [...new Set(additions)].map(toObjectId)
      return [...new Set([...prevs.map(e => e.toString()), ...additions])].map(toObjectId)
    }

    if (data.genre) {
      videoDocument.genre = addToSet(videoDocument.genre, data.genre)
    }

    if (data.category) {
      videoDocument.category = addToSet(videoDocument.category, data.category)
    }

    if (data.cast) {
      videoDocument.cast = addToSet(videoDocument.cast, data.cast)
    }

    videoDocument.defaultRating = data.defaultRating
      ? Number(data.defaultRating)
      : videoDocument.defaultRating

    videoDocument.releaseDate = data.releasedDate
      ? new Date(data.releasedDate)
      : videoDocument.releaseDate

    videoDocument.expiryDate = data.expiryDate
      ? new Date(data.expiryDate)
      : videoDocument.expiryDate

    const expiry = videoDocument.expiryDate ?? undefined

    videoDocument.videoLink = data.videoLink || videoDocument.videoLink
    videoDocument.trailerLink = data.trailerLink || videoDocument.trailerLink
    videoDocument.runtime = data.runtime || videoDocument.runtime
    videoDocument.active = data.active || videoDocument.active
    videoDocument.showViews = data.showViews || videoDocument.showViews
    videoDocument.upcoming = data.upcoming || videoDocument.upcoming

    if (data.portraitPoster) {
      const potraitUpload = await MediaManagement.storeImage(data.portraitPoster, expiry)

      if (videoDocument.portraitPhoto) {
        MediaManagement.deleteObject(
          videoDocument.portraitPhoto.Key,
          videoDocument.portraitPhoto.Bucket,
        )
      }

      videoDocument.portraitPhoto = {
        Bucket: potraitUpload.Bucket,
        Key: potraitUpload.Key,
      }
    }

    if (data.landscapePoster) {
      const newLandscapePoster = await MediaManagement.storeImage(data.landscapePoster, expiry)

      if (videoDocument.landscapePhoto) {
        MediaManagement.deleteObject(
          videoDocument.landscapePhoto.Key,
          videoDocument.landscapePhoto.Bucket,
        )
      }

      videoDocument.portraitPhoto = {
        Bucket: newLandscapePoster.Bucket,
        Key: newLandscapePoster.Key,
      }
    }

    if (data.video) {
      const videoUpload = await MediaManagement.uploadAndInitiateMediaConvert(data.video, expiry)

      if (videoDocument.videoUpload) {
        Purge.videoUploadById(videoDocument.videoUpload)
      }

      const videoUploadDocument = UploadMediaUtils.getVideoUploadDocument(videoUpload)
      videoUploadDocument.parentId = videoDocument._id
      videoUploadDocument.parentType = 'vod'
      await videoUploadDocument.save({ session })
      videoDocument.videoUpload = videoUploadDocument._id
      videoDocument.isVideoReady = false
    }

    if (data.trailer) {
      const trailerUpload = await MediaManagement.uploadAndInitiateMediaConvert(
        data.trailer,
        expiry,
      )

      if (videoDocument.trailerUpload) {
        Purge.videoUploadById(videoDocument.trailerUpload)
      }

      const videoUploadDocument = UploadMediaUtils.getVideoUploadDocument(trailerUpload)
      videoUploadDocument.parentId = videoDocument._id
      videoUploadDocument.parentType = 'vod-trailer'
      videoDocument.trailerUpload = videoUploadDocument._id
      await videoUploadDocument.save({ session })
      videoDocument.isTrailerReady = false
    }

    await videoDocument.save({ session })
    return videoDocument
  }

  static deleteVideo = async (vidId: string, type: AllVideoTypes) => {
    const deletedVidocument = await VideoModel.findOneAndDelete({ _id: vidId, type })

    if (deletedVidocument == null) {
      throw new OperationalError(`Not found or video is not a ${type} `, 404)
    }

    // do not await
    Purge.vod(deletedVidocument)
  }

  static getVideos = async (
    type: AllVideoTypes,
    queryParams: QueryParamsFeaturesOptions['queryParams'],
  ) => {
    const aggrgatedVideoDocuments = await VideoRepo.fetchByType(
      type,
      guranteeNumericResult(queryParams.page, 1),
      guranteeNumericResult(queryParams.limit, 1),
    )

    return MovieMediaSourcesUtils.resolveMediaSources(aggrgatedVideoDocuments, '720p')
  }

  static getSeasonsAndEpisodes = async (vidSeriesId: string, queryParams: any) => {
    const { page, limit } = QueryParamsFeatures.paginagteParams(queryParams)

    const seasonsWithMediaSources = MovieMediaSourcesUtils.resolveSeasonsMediaSources(
      await VideoRepo.fetchSeasonsAndEpisodes(vidSeriesId, page, limit),
      '720p',
    )

    return seasonsWithMediaSources
  }
}

export type AddEpisodeInput = {
  seasonId: string
  data: EpisodeReqData
  adminId: string
}

type EpisodeReqData = {
  title: string
  description?: string
  videoLink?: string
  trailerLink?: string
  subTitleLanguage?: string
  subTitle?: MulterFile
  video?: MulterFile
  trailer?: MulterFile
}

export type AllVideoTypes = Video['type']

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

export type GetVideoUploadDoc = UploadAndTranscodeConfig & {
  parentType: (typeof videoUploadParents)[number]
  parentId: StringOrObjectId
}
