import { ClientSession, Types } from 'mongoose'
import { PosterImage, PosterImageModel } from '../models/poster.model'
import { Video, VideoModel, videoTypes } from '../models/videos.model'
import { OperationalError } from '../utils/OperationalError'

import { Episode, EpisodeModel } from '../models/episodes.model'
import { MediaManagement, UploadAndTranscodeConfig } from './../services/media-management'
import { MulterFile, StringOrObjectId } from '../types'
import { TrailerModel } from '../models/trailer.model'
import { VideoUploadModel } from '../models/videoupload.model'
import { videoUploadParents } from '../models/assets'
import {
  AddEpisodeUtilAggrRes,
  AddSeasonUtilAggrRes,
  toObjectId,
  VideoRepo,
} from '../repositories/VideoRepo'
import { addSeriesSchema, addMovieOrSkitSchema, addMusicVideoSchema } from '../validations/admin'
import { validate } from '../middlewares/requestValidator'
import { Purge } from './Purge'
import { MaybeSession } from './mongoDbSessionRunner'
import { ValidCurrency } from './currency'

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
  vidClass: Video['vid_class']
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

export type ImageUploadRes = Awaited<ReturnType<typeof MediaManagement.store>>

export type SavePostersUploadToDBParams = {
  portraitPosterUpload: ImageUploadRes
  landscapePosterUpload: ImageUploadRes
  videoId: StringOrObjectId
  posterParentType: PosterImage['parentType']
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

type UploadEpisodeVideos = {
  data: EpisodeReqData
  episode: Episode
}

export class UploadMediaUtils {
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

   static _checkFiles = (files?: RequestFiles) => {
    if (files == null) {
      throw new OperationalError('expected at least one file', 400)
    }

    if (Array.isArray(files)) {
      throw new OperationalError('expected multiple files as an object', 400)
    }

    return files
  }

  protected static _allowMimetype = (
    file: MulterFile,
    type: 'image' | 'video' | 'text',
    msg: string,
  ) => {
    if (!file.mimetype.startsWith(type)) {
      throw new OperationalError(msg, 400)
    }
  }

  protected static _uploadTrailerAndVideo = async (
    video: UploadTrailerAndVIdeoInput,
    trailer: UploadTrailerAndVIdeoInput,
    session: MaybeSession,
  ) => {
    const files = [video, trailer]

    const [videoUpload, trailerUpload] = await Promise.all(
      files.map(file =>
        MediaManagement.uploadAndInitiateMediaConvert({
          file: file.file,
          expire: file.expire,
        }),
      ),
    )

    const videoUploadDoc = new VideoUploadModel({
      bucket: videoUpload.Bucket,
      key: videoUpload.Key,
      mimetype: videoUpload.mimetype,
      size: videoUpload.size,
      isTranscoded: videoUpload.isTranscoded,
      parentId: video.parentId,
      parentType: video.parentType,
    })

    const trailerVidUploadDoc = new VideoUploadModel({
      bucket: trailerUpload.Bucket,
      key: trailerUpload.Key,
      mimetype: trailerUpload.mimetype,
      size: trailerUpload.size,
      isTranscoded: trailerUpload.isTranscoded,
      parentId: trailer.parentId,
      parentType: trailer.parentType,
    })

    await videoUploadDoc.save({ session })
    await trailerVidUploadDoc.save({ session })
    return { videoUploadDoc, trailerVidUploadDoc }
  }

  protected static _getVideoUploadDoc = async (
    params: GetVideoUploadDoc,
    session: MaybeSession,
  ) => {
    const res = await MediaManagement.uploadAndInitiateMediaConvert({
      file: params.file,
      expire: params.expire,
    })

    const videoUploadDoc = new VideoUploadModel({
      bucket: res.Bucket,
      key: res.Key,
      mimetype: res.mimetype,
      size: res.size,
      isTranscoded: res.isTranscoded,
      parentId: params.parentId,
      parentType: params.parentType,
    })

    await videoUploadDoc.save({ session })
    return videoUploadDoc
  }

  protected static _uploadVideoPosters = async <T extends MulterFile>(
    portraitFile: T,
    landscapeFile: T,
  ) => {
    const [portraitUpload, landscapeUpload] = await Promise.all([
      MediaManagement.store({ baseDir: 'images', expire: undefined, file: portraitFile }),
      MediaManagement.store({ baseDir: 'images', expire: undefined, file: landscapeFile }),
    ])

    return {
      portraitUpload,
      landscapeUpload,
    }
  }

  protected static _savePostersUploadToDb = async (
    {
      portraitPosterUpload,
      landscapePosterUpload,
      videoId,
      posterParentType,
    }: SavePostersUploadToDBParams,
    session: MaybeSession,
  ) => {
    // save portrait
    const portrait = await new PosterImageModel({
      video_id: videoId,
      bucket: portraitPosterUpload.Bucket,
      key: portraitPosterUpload.Key,
      parentType: posterParentType,
      dimension: 'portrait',
    }).save({ session })

    // save landscape
    const landscape = await new PosterImageModel({
      video_id: videoId,
      bucket: landscapePosterUpload.Bucket,
      key: landscapePosterUpload.Key,
      parentType: posterParentType,
      dimension: 'landscape',
    }).save({ session })

    return { portrait, landscape }
  }

  protected static _uploadAndSavePostersToDB = async (
    { landscapeFile, portraitFile, videoId, posterParentType }: UploadAndSavePostersToDBParams,
    session: MaybeSession,
  ) => {
    const { portraitUpload, landscapeUpload } = await this._uploadVideoPosters(
      portraitFile,
      landscapeFile,
    )

    //save to db
    return await this._savePostersUploadToDb(
      {
        portraitPosterUpload: portraitUpload,
        landscapePosterUpload: landscapeUpload,
        videoId,
        posterParentType,
      },
      session,
    )
  }

  protected static _validateAddVideoFileTypes = (
    data: AddVideoParams['data'] | EditVideoParams['data'],
  ) => {
    data.portraitPoster &&
      this._allowMimetype(data.portraitPoster, 'image', 'portraitPoster must be an image')
    data.landscapePoster &&
      this._allowMimetype(data.landscapePoster, 'image', 'landscapePoster must be an image')
    data.trailer && this._allowMimetype(data.trailer, 'video', ' trailer must be a video file')
    data.video && this._allowMimetype(data.video, 'video', 'video must be a video file')
  }

  protected static _uploadVidAndTrailer = async (
    { data, videoDoc }: UploadVideoAndTrailerInput,
    session: MaybeSession,
  ) => {
    const expire = videoDoc.expiry_date ?? undefined

    if (data.trailer && data.video) {
      const trailerDoc = new TrailerModel({
        video_id: videoDoc._id,
        parentType: 'vod',
      })

      const { videoUploadDoc, trailerVidUploadDoc } = await this._uploadTrailerAndVideo(
        { file: data.video, expire, parentId: videoDoc._id, parentType: 'vod' },
        { file: data.trailer, expire, parentId: trailerDoc._id, parentType: 'trailer' },
        session,
      )

      trailerDoc.video_upload = trailerVidUploadDoc._id
      videoDoc.video_upload = videoUploadDoc._id
      videoDoc.trailer_upload = trailerDoc._id
      await trailerDoc.save({ session })
      return
    }

    if (data.trailer) {
      const trailerDoc = new TrailerModel({
        video_id: videoDoc._id,
        parentType: 'vod',
      })

      const tVidUploadDoc = await this._getVideoUploadDoc(
        {
          file: data.trailer,

          expire,
          parentId: trailerDoc._id,
          parentType: 'trailer',
        },
        session,
      )

      trailerDoc.video_upload = tVidUploadDoc._id
      videoDoc.trailer_upload = trailerDoc._id
      await trailerDoc.save({ session })
    }

    if (data.video) {
      const vidUploadDoc = await this._getVideoUploadDoc(
        {
          file: data.video,
          parentId: videoDoc._id,
          parentType: 'vod',
          expire,
        },
        session,
      )

      videoDoc.video_upload = vidUploadDoc._id
    }
  }

  protected static _uploadVideoSession = async (params: AddVideoParams, session: MaybeSession) => {
    const { data, type, adminId } = params

    this._validateAddVideoFileTypes(data)

    if (data.vidClass === 'exclusive' && data.amount == null) {
      throw new OperationalError('amount is required when vid class is exclusive', 400)
    }

    const videoDoc = new VideoModel({
      type,
      admin_id: adminId,
      title: data.title,
      primaryColor: data.primaryColor,
      description: data.description,
      vid_class: data.vidClass,
      artist_name: data.artistName,
      pg: data.pg,
      amount: data.amount,
      genre: data.genre ?? [],
      category: data.category ?? [],
      cast: data.cast ?? [],
      default_rating: data.defaultRating,
      released_date: data.releasedDate,
      expiry_date: data.expiryDate,
      videoLink: data.videoLink,
      trailerLink: data.trailerLink,
      runtime: data.runtime,
      currency: data.currency,
      active: data.active,
      showViews: data.showViews,
      is_series: type === 'series',
    })

    const uploadPostersParams: UploadAndSavePostersToDBParams = {
      portraitFile: data.portraitPoster,
      landscapeFile: data.landscapePoster,
      videoId: videoDoc._id,
      posterParentType: 'vod',
    }

    const uploadVidAndTrailerParams: UploadVideoAndTrailerInput = {
      data,
      videoDoc,
    }

    const { landscape, portrait } = await this._uploadAndSavePostersToDB(
      uploadPostersParams,
      session,
    )

    await this._uploadVidAndTrailer(uploadVidAndTrailerParams, session)

    videoDoc.landscape_photo = landscape._id
    videoDoc.portrait_photo = portrait._id

    await videoDoc.save({ session })
    return videoDoc
  }

  protected static _editVideoSession = async (
    { data, adminId, videoId }: EditVideoParams,
    session: MaybeSession,
  ) => {
    this._validateAddVideoFileTypes(data)

    const vod = await VideoModel.findById(videoId)

    if (vod == null) {
      throw new OperationalError('invalid video id', 404)
    }

    vod.description = data.description || vod.description
    vod.amount = data.amount || vod.amount
    vod.title = data.title || vod.title
    vod.primaryColor = data.primaryColor || vod.primaryColor

    vod.upcoming = data.upcoming || vod.upcoming
    vod.admin_id = toObjectId(adminId)
    vod.description = data.description || vod.description
    vod.vid_class = (data.vidClass as any) || vod.vid_class
    vod.artist_name = data.artistName || vod.artist_name
    vod.pg = data.pg || vod.pg

    const addToSet = (prevs: Types.ObjectId[] | undefined | null, additions: string[]) => {
      if (!prevs) return [...new Set(additions)].map(toObjectId)
      return [...new Set([...prevs.map(e => e.toString()), ...additions])].map(toObjectId)
    }

    if (data.genre) {
      vod.genre = addToSet(vod.genre, data.genre)
    }

    if (data.category) {
      vod.category = addToSet(vod.category, data.category)
    }

    if (data.cast) {
      vod.cast = addToSet(vod.cast, data.cast)
    }

    vod.default_rating = data.defaultRating ? Number(data.defaultRating) : vod.default_rating
    vod.released_date = data.releasedDate ? new Date(data.releasedDate) : vod.released_date
    vod.expiry_date = data.expiryDate ? new Date(data.expiryDate) : vod.expiry_date
    vod.videoLink = data.videoLink || vod.videoLink
    vod.trailerLink = data.trailerLink || vod.trailerLink
    vod.runtime = data.runtime || vod.runtime
    vod.active = data.active || vod.active
    vod.showViews = data.showViews || vod.showViews
    vod.upcoming = data.upcoming || vod.upcoming

    let prevTrailerId: Types.ObjectId | null = null
    let prevPortraitPoster: Types.ObjectId | null = null
    let prevLandscapePoster: Types.ObjectId | null = null
    let prevVideoUploadId: Types.ObjectId | null = null

    if (data.portraitPoster) {
      const newPosterUpload = await MediaManagement.store({
        file: data.portraitPoster,
        expire: undefined,
        baseDir: 'images',
      })

      const posterDoc = await new PosterImageModel({
        video_id: vod._id,
        bucket: newPosterUpload.Bucket,
        key: newPosterUpload.Key,
        dimension: 'portrait',
        parentType: 'vod',
      }).save({ session })

      prevPortraitPoster = vod.portrait_photo
      vod.portrait_photo = posterDoc._id
    }

    if (data.landscapePoster) {
      const newLandscapePoster = await MediaManagement.store({
        file: data.landscapePoster,
        expire: undefined,
        baseDir: 'images',
      })

      const landscapeDoc = await new PosterImageModel({
        video_id: vod._id,
        bucket: newLandscapePoster.Bucket,
        key: newLandscapePoster.Key,
        dimension: 'landscape',
        parentType: 'vod',
      }).save({ session })

      prevLandscapePoster = vod.landscape_photo
      vod.landscape_photo = landscapeDoc._id
    }

    if (data.video) {
      prevVideoUploadId = vod.video_upload

      const vidoeUpload = await MediaManagement.store({
        file: data.video,
        expire: vod.expiry_date ?? undefined,
        baseDir: 'videos',
      })

      const vidUploadDoc = await new VideoUploadModel({
        bucket: vidoeUpload.Bucket,
        key: vidoeUpload.Key,
        mimetype: vidoeUpload.mimetype,
        size: vidoeUpload.size,
        parentType: 'vod',
        parentId: vod._id,
      }).save({ session })

      vod.videoLink = null as unknown as string
      vod.video_upload = vidUploadDoc._id
    }

    if (data.trailer) {
      prevTrailerId = vod.trailer_upload

      const trailerVideoUpload = await MediaManagement.store({
        file: data.trailer,
        expire: undefined,
        baseDir: 'videos',
      })

      const trailerDoc = new TrailerModel({
        video_id: vod._id,
        parentType: 'vod',
      })

      const trailerVideoUploadDoc = await new VideoUploadModel({
        bucket: trailerVideoUpload.Bucket,
        key: trailerVideoUpload.Key,
        mimetype: trailerVideoUpload.mimetype,
        size: trailerVideoUpload.size,
        parentType: 'trailer',
        parentId: trailerDoc._id,
      }).save({ session })

      trailerDoc.video_upload = trailerVideoUploadDoc._id
      vod.trailerLink = null as unknown as string
      await trailerDoc.save({ session })
    }

    await vod.save({ session })

    if (prevPortraitPoster) Purge.posterById(prevPortraitPoster)
    if (prevLandscapePoster) Purge.posterById(prevLandscapePoster)
    if (prevTrailerId) Purge.trailerById(prevTrailerId)
    if (prevVideoUploadId) Purge.videoUploadById(prevVideoUploadId)

    return vod
  }

  protected static _validateWithMovieAndPrevSeasonsAggrResult = (res: AddSeasonUtilAggrRes[]) => {
    if (res.length === 0) {
      throw new OperationalError('invalid videoId', 404)
    }

    const { totalEpisodesOfLastSeason, movieExpiryDate, totalPreviousSeasons, isMovieSeries } =
      res[0]

    if (!isMovieSeries) {
      throw new OperationalError('movie is not a series', 403)
    }

    if (totalPreviousSeasons > 0 && totalEpisodesOfLastSeason === 0) {
      throw new OperationalError(
        'Creating a new season when the most recent season has no episodes is not allowed',
        403,
      )
    }

    if (movieExpiryDate && new Date() > movieExpiryDate) {
      throw new OperationalError('Movie has expired', 403)
    }
  }

  private static _uploadEpisodeVideos = async (
    { data, episode }: UploadEpisodeVideos,
    session: MaybeSession,
  ) => {
    if (data.trailer && data.video) {
      const expire = undefined

      const trailerDoc = new TrailerModel({
        video_id: episode._id,
        parentType: 'episode',
      })

      const { videoUploadDoc, trailerVidUploadDoc } = await this._uploadTrailerAndVideo(
        { file: data.video, expire, parentId: episode._id, parentType: 'episode' },
        { file: data.trailer, expire, parentId: trailerDoc._id, parentType: 'trailer' },
        session,
      )

      trailerDoc.video_upload = trailerVidUploadDoc._id
      episode.videoUpload = videoUploadDoc._id
      episode.trailerUpload = trailerDoc._id

      await trailerDoc.save({ session })
      await episode.save({ session })
      return
    }

    if (data.trailer) {
      const trailerDoc = new TrailerModel({
        video_id: episode._id,
        parentType: 'episode',
      })

      const tVidUploadDoc = await this._getVideoUploadDoc(
        {
          file: data.trailer,
          expire: undefined,
          parentId: trailerDoc._id,
          parentType: 'trailer',
        },
        session,
      )

      trailerDoc.video_upload = tVidUploadDoc._id
      episode.trailerUpload = trailerDoc._id
      await trailerDoc.save({ session })
    }

    if (data.video) {
      const vidUploadDoc = await this._getVideoUploadDoc(
        {
          file: data.video,
          expire: undefined,
          parentId: episode._id,
          parentType: 'episode',
        },
        session,
      )

      episode.videoUpload = vidUploadDoc._id
    }
  }

  protected static _validateWithSeasonAndPrevEpisodes = (aggrRes: AddEpisodeUtilAggrRes[]) => {
    if (aggrRes.length == 0) {
      throw new OperationalError('invalid season Id', 404)
    }

    const [
      {
        totalPreviousEpisodes,
        isRecentEpisodeTrailerVidUploadTranscoded,
        isRecentEpisodeVidUploadTranscoded,
        isTrailerUploadVidTranscoded,
        seasonTrailerLink,
        recentEpisodeTrailerLink,
        recentEpisodeVideoLink,
      },
    ] = aggrRes

    if (totalPreviousEpisodes === 0) return

    if (seasonTrailerLink === null && isTrailerUploadVidTranscoded === false) {
      throw new OperationalError('season trailer upload video is still transcoding', 400)
    }

    if (recentEpisodeTrailerLink === null && isRecentEpisodeTrailerVidUploadTranscoded === false) {
      throw new OperationalError("previousEpisode's trailer video upload is still transcoding", 400)
    }

    if (recentEpisodeVideoLink === null && isRecentEpisodeVidUploadTranscoded === false) {
      throw new OperationalError("previousEpisode's video is still transcoding", 400)
    }
  }

  protected static _addEpisodesWithSession = async (
    { seasonId, data, adminId }: AddEpisodeInput,
    session: MaybeSession,
  ) => {
    data.subTitle && this._allowMimetype(data.subTitle, 'text', 'subTitle must be a text file')
    data.trailer && this._allowMimetype(data.trailer, 'video', ' trailer must be a video file')
    data.video && this._allowMimetype(data.video, 'video', 'video must be a video file')

    const aggrUtilsRes = await VideoRepo.addEpisodeUtilAggr(seasonId)
    this._validateWithSeasonAndPrevEpisodes(aggrUtilsRes)

    const episode = new EpisodeModel({
      title: data.title,
      description: data.description,
      episodeNumber: aggrUtilsRes[0].totalPreviousEpisodes + 1,
      trailerLink: data.trailerLink,
      videoLink: data.videoLink,
      season: seasonId,
      admin: adminId,
    })

    await this._uploadEpisodeVideos({ data, episode }, session)
    await episode.save({ session })
    return episode
  }
}
