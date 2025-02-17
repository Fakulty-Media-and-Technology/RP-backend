import { ClientSession } from 'mongoose'
import { PosterImage, PosterImageModel } from '../models/poster.model'
import { Video, VideoModel, videoTypes } from '../models/videos.model'
import { OperationalError } from '../utils/OperationalError'

import { SeasonModel } from '../models/seasons.model'
import { EpisodeModel } from '../models/episodes.model'
import { MediaManagement, UploadAndTranscodeConfig } from './../services/media-management'
import { MulterFile, StringOrObjectId } from '../types'
import { TrailerModel } from '../models/trailer.model'
import { VideoUploadModel } from '../models/videoupload.model'
import { videoUploadParents } from '../models/assets'
import { AddEpisodeUtilAggrRes, AddSeasonUtilAggrRes, VideoRepo } from '../repositories/VideoRepo'
import { addSeriesSchema, addMovieOrSkitSchema, addMusicVideoSchema } from '../validations/admin'
import { validate } from '../middlewares/requestValidator'

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
  vidClass: string

  defaultRating?: string
  videoLink?: string
  trailerLink?: string
  runtime?: string
  expiryDate?: string
  releasedDate: string
  artistName?: string

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
  trailerLink?: string
  portraitPhoto?: MulterFile
  landscapePhoto?: MulterFile
  trailer?: MulterFile
}

export type AddVideoParams = {
  data: MovieData
  type: AllVideoTypes
  adminId: string
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

  protected static _checkFiles = (files?: RequestFiles) => {
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
    session: ClientSession,
  ) => {
    const files = [video, trailer]

    const [videoUpload, trailerUpload] = await Promise.all(
      files.map(file =>
        MediaManagement.uploadAndTransacodeVideo({
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
    session?: ClientSession,
  ) => {
    const res = await MediaManagement.uploadAndTransacodeVideo({
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
    session: ClientSession,
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
    session: ClientSession,
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

  protected static _validateAddVideoFileTypes = (data: AddVideoParams['data']) => {
    this._allowMimetype(data.portraitPoster, 'image', 'portraitPoster must be an image')
    this._allowMimetype(data.landscapePoster, 'image', 'landscapePoster must be an image')
    data.trailer && this._allowMimetype(data.trailer, 'video', ' trailer must be a video file')
    data.video && this._allowMimetype(data.video, 'video', 'video must be a video file')
  }

  protected static _uploadVidAndTrailer = async (
    { data, videoDoc }: UploadVideoAndTrailerInput,
    session: ClientSession,
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

  protected static _uploadVideoSession = async (params: AddVideoParams, session: ClientSession) => {
    const { data, type, adminId } = params

    this._validateAddVideoFileTypes(data)

    const videoDoc = new VideoModel({
      type,
      admin_id: adminId,
      title: data.title,
      description: data.description,
      vid_class: data.vidClass,
      artist_name: data.artistName,
      pg: data.pg,
      genre: data.genre ?? [],
      category: data.category ?? [],
      cast: data.cast ?? [],
      default_rating: data.defaultRating,
      released_date: data.releasedDate,
      expiry_date: data.expiryDate,
      videoLink: data.videoLink,
      trailerLink: data.trailerLink,
      runtime: data.runtime,
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

  protected static _validateWithMovieAndPrevSeasonsAggrResult = (res: AddSeasonUtilAggrRes[]) => {
    if (res.length === 0) {
      throw new OperationalError('invalid videoId', 404)
    }

    const {
      totalEpisodesOfLastSeason,
      movieExpiryDate,
      totalPreviousSeasons,
      movieTrailerLink,
      isMovieTrailerVidUploadTranscoded,
      isMovieSeries,
    } = res[0]

    if (!isMovieSeries) {
      throw new OperationalError('movie is not a series', 403)
    }

    if (totalPreviousSeasons > 0 && totalEpisodesOfLastSeason === 0) {
      throw new OperationalError(
        'Creating a new season when the most recent season has no episodes is not allowed',
        403,
      )
    }

    // Movie must not have a trailer but if it does and it is a trailer upload then season creation must wait for transcode to complete
    if (movieTrailerLink == null && isMovieTrailerVidUploadTranscoded === false) {
      throw new OperationalError('Movie trailer video upload has not finished transcoding', 403)
    }

    if (movieExpiryDate && new Date() > movieExpiryDate) {
      throw new OperationalError('Movie has expired', 403)
    }
  }

  protected static _addSeasonWithSession = async (
    { videoId, adminId, ...params }: AddSeasonParams,
    session: ClientSession,
  ) => {
    params.trailer && this._allowMimetype(params.trailer, 'video', ' trailer must be a video file')

    params.landscapePhoto &&
      this._allowMimetype(params.landscapePhoto, 'image', ' landscapePhoto must be an image file')

    params.portraitPhoto &&
      this._allowMimetype(params.portraitPhoto, 'image', ' portraitPhoto must be an image file')

    const aggrRes = await VideoRepo.addSeasonUtilAggr(videoId)

    this._validateWithMovieAndPrevSeasonsAggrResult(aggrRes)

    const season = new SeasonModel({
      admin: adminId,
      video: videoId,
      serial_number: aggrRes[0].totalPreviousSeasons + 1,
      trailerLink: params.trailerLink,
    })

    if (params.landscapePhoto && params.portraitPhoto) {
      const { landscape, portrait } = await this._uploadAndSavePostersToDB(
        {
          portraitFile: params.portraitPhoto,
          landscapeFile: params.landscapePhoto,
          videoId: season._id,
          posterParentType: 'season',
        },
        session,
      )

      season.landscapePhoto = landscape._id
      season.portraitPhoto = portrait.id
    }

    if (params.trailer) {
      const trailerDoc = new TrailerModel({
        video_id: season._id,
        parentType: 'season',
      })

      const tVidUploadDoc = await this._getVideoUploadDoc(
        {
          file: params.trailer,

          expire: aggrRes[0].movieExpiryDate,
          parentId: trailerDoc._id,
          parentType: 'trailer',
        },
        session,
      )

      trailerDoc.video_upload = tVidUploadDoc._id
      season.trailer = trailerDoc._id
      await trailerDoc.save({ session })
    }

    await season.save({ session })
    return season
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
    session: ClientSession,
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
      return episode
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

    await episode.save({ session })
    return episode
  }
}
