import { ClientSession } from 'mongoose'
import { PosterImage, PosterImageModel } from '../../models/poster.model'

import { Video, VideoModel } from '../../models/videos.model'
import { OperationalError } from '../../utils/OperationalError'

import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { SeasonModel } from '../../models/seasons.model'
import { EpisodeModel } from '../../models/episodes.model'
import { MediaManagement, UploadAndTranscodeConfig } from '../media-management'
import { StringOrObjectId } from '../../types'
import { TrailerModel } from '../../models/trailer.model'
import { VideoUploadModel } from '../../models/videoupload.model'
import { SubtitleModel } from '../../models/subtitle.model'
import { videoUploadParents } from '../../models/assets'
import { VideoRepo } from '../../repositories/VideoRepo'
import { Season } from '../../types/movie'

import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'

import {
  handleDefaultNumAndUnknown,
  QueryParamsFeaturesOptions,
} from '../../utils/QueryParamsFeatures'

export type AllVideoTypes = Video['type']

type EpisodeReqData = {
  title: string
  description?: string
  videoLink?: string
  trailerLink?: string
  subTitleLanguage?: string
  subTitle?: Express.Multer.File
  video?: Express.Multer.File
  trailer?: Express.Multer.File
}

type AddEpisodeInput = {
  seasonId: string
  data: EpisodeReqData
  adminId: string
}

type EditVideoInput = {
  vidId: string
  type: AllVideoTypes
  changes: Record<string, any>
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
  subTitleLanguage?: string

  category?: string[]
  genre?: string[]
  cast?: string[]

  //files
  landscapePoster: Express.Multer.File
  portraitPoster: Express.Multer.File
  subTitle?: Express.Multer.File
  trailer?: Express.Multer.File
  video?: Express.Multer.File
}

type AddSeasonParams = {
  adminId: string
  videoId: string
  trailerLink?: string
  portraitPhoto?: Express.Multer.File
  landscapePhoto?: Express.Multer.File
  trailer?: Express.Multer.File
}

export type AddVideoParams = {
  data: MovieData
  type: AllVideoTypes
  adminId: string
}

type ImageUploadRes = Awaited<ReturnType<typeof MediaManagement.uploadImageOrSubtitle>>

type SavePostersUploadToDBParams = {
  portraitPosterUpload: ImageUploadRes
  landscapePosterUpload: ImageUploadRes
  videoId: StringOrObjectId
  posterParentType: PosterImage['parentType']
}

type UploadAndSavePostersToDBParams = Pick<
  SavePostersUploadToDBParams,
  'videoId' | 'posterParentType'
> & {
  portraitFile: Express.Multer.File
  landscapeFile: Express.Multer.File
}

type GetVideoUploadDoc = UploadAndTranscodeConfig & {
  parentType: (typeof videoUploadParents)[number]
  parentId: StringOrObjectId
}

type UploadTrailerAndVIdeoInput = {
  file: Express.Multer.File
  expire: Date | undefined
  parentId: StringOrObjectId
  parentType: (typeof videoUploadParents)[number]
}

export class AdminUploadService {
  protected static _allowMimetype = (
    file: Express.Multer.File,
    type: 'image' | 'video' | 'text',
    msg: string,
  ) => {
    if (!file.mimetype.startsWith(type)) {
      throw new OperationalError(msg, 400)
    }
  }
  static resolveWithMediaSources = (queryParams: QueryParamsFeaturesOptions['queryParams']) =>
    queryParams.withMediaSources === 'true'

  private static _uploadTrailerAndVideo = async (
    video: UploadTrailerAndVIdeoInput,
    trailer: UploadTrailerAndVIdeoInput,
    session: ClientSession,
  ) => {
    const files = [video, trailer]

    const [videoUpload, trailerUpload] = await Promise.all(
      files.map(file =>
        MediaManagement.uploadAndTransacodeVideo({
          file: file.file,
          waitTranscode: true,
          waitDuration: 30,
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
      waitTranscode: params.waitTranscode,
      waitDuration: params.waitDuration,
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

  protected static _uploadVideoPosters = async (
    portraitFile: Express.Multer.File,
    landscapeFile: Express.Multer.File,
  ) => {
    const [portraitUpload, landscapeUpload] = await Promise.all([
      MediaManagement.uploadImageOrSubtitle({ type: 'image', file: portraitFile }),
      MediaManagement.uploadImageOrSubtitle({ type: 'image', file: landscapeFile }),
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

  private static _uploadVideoSesion = async (
    { data, type, adminId }: AddVideoParams,
    session: ClientSession,
  ) => {
    this._allowMimetype(data.portraitPoster, 'image', 'portraitPoster must be an image')
    this._allowMimetype(data.landscapePoster, 'image', 'landscapePoster must be an image')
    data.subTitle && this._allowMimetype(data.subTitle, 'text', 'subTitle must be a text file')
    data.trailer && this._allowMimetype(data.trailer, 'video', ' trailer must be a video file')
    data.video && this._allowMimetype(data.video, 'video', 'video must be a video file')

    const isSeries = type === 'series'

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
      is_series: isSeries,
    })

    const { landscape, portrait } = await this._uploadAndSavePostersToDB(
      {
        portraitFile: data.portraitPoster,
        landscapeFile: data.landscapePoster,
        videoId: videoDoc._id,
        posterParentType: 'vod',
      },
      session,
    )

    videoDoc.landscape_photo = landscape._id
    videoDoc.portrait_photo = portrait._id

    const vidUploadExpire = videoDoc.expiry_date || undefined

    if (data.subTitle) {
      const res = await MediaManagement.uploadImageOrSubtitle({
        type: 'subtitle',
        file: data.subTitle,
      })

      const subtitleDoc = new SubtitleModel({
        video_id: videoDoc._id,
        parentType: 'vod',
        language: data.subTitleLanguage,
        key: res.Key,
        bucket: res.Bucket,
        is_series: isSeries,
      })

      videoDoc.subtitle_upload = subtitleDoc._id
      await subtitleDoc.save({ session })
    }

    if (data.trailer && data.video) {
      const expire = vidUploadExpire

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
      await videoDoc.save({ session })
      return videoDoc
    }

    if (data.trailer) {
      const trailerDoc = new TrailerModel({
        video_id: videoDoc._id,
        parentType: 'vod',
      })

      const tVidUploadDoc = await this._getVideoUploadDoc(
        {
          file: data.trailer,
          waitTranscode: true,
          waitDuration: 30,
          expire: vidUploadExpire,
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
          waitTranscode: true,
          waitDuration: 30,
          expire: vidUploadExpire,
          parentId: videoDoc._id,
          parentType: 'vod',
        },
        session,
      )

      videoDoc.video_upload = vidUploadDoc._id
    }

    await videoDoc.save({ session })
    return videoDoc
  }

  private static _addSeasonWithSession = async (
    { videoId, adminId, ...params }: AddSeasonParams,
    session: ClientSession,
  ) => {
    params.trailer && this._allowMimetype(params.trailer, 'video', ' trailer must be a video file')

    params.landscapePhoto &&
      this._allowMimetype(params.landscapePhoto, 'image', ' landscapePhoto must be an image file')

    params.portraitPhoto &&
      this._allowMimetype(params.portraitPhoto, 'image', ' portraitPhoto must be an image file')

    const [prevSeasons, parentVideo] = await Promise.all([
      SeasonModel.find({ video: videoId }),
      VideoModel.findById(videoId),
    ])

    if (parentVideo == null) {
      throw new OperationalError('invalid videoId', 404)
    }

    if (parentVideo.type !== 'series') {
      throw new OperationalError('only series video type can have seasons', 403)
    }

    const season = new SeasonModel({
      admin: adminId,
      video: videoId,
      serial_number: prevSeasons.length + 1,
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
          waitTranscode: true,
          waitDuration: 30,
          expire: parentVideo.expiry_date || undefined,
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

  private static _addEpisodesWithSession = async (
    { seasonId, data, adminId }: AddEpisodeInput,
    session: ClientSession,
  ) => {
    data.subTitle && this._allowMimetype(data.subTitle, 'text', 'subTitle must be a text file')
    data.trailer && this._allowMimetype(data.trailer, 'video', ' trailer must be a video file')
    data.video && this._allowMimetype(data.video, 'video', 'video must be a video file')

    const [prevEpisodes, parentSeason] = await Promise.all([
      EpisodeModel.find({ season: seasonId }),
      SeasonModel.findById(seasonId),
    ])

    if (parentSeason == null) {
      throw new OperationalError('invalid season Id', 404)
    }

    const episode = new EpisodeModel({
      title: data.title,
      description: data.description,
      episodeNumber: prevEpisodes.length + 1,
      trailerLink: data.trailerLink,
      videoLink: data.videoLink,
      season: seasonId,
      admin: adminId,
    })

    if (data.subTitle) {
      const res = await MediaManagement.uploadImageOrSubtitle({
        type: 'subtitle',
        file: data.subTitle,
      })

      const subtitleDoc = new SubtitleModel({
        video_id: episode._id,
        parentType: 'episode',
        language: data.subTitleLanguage,
        key: res.Key,
        bucket: res.Bucket,
        is_series: true,
      })

      episode.subtitleUpload = subtitleDoc._id
      await subtitleDoc.save({ session })
    }

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
          waitTranscode: false,
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
          waitTranscode: true,
          waitDuration: 30,
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

  static addVideo = async (input: AddVideoParams) => {
    return await withMongoDBSession(this._uploadVideoSesion, input)
  }

  static addSeason = async (params: AddSeasonParams) => {
    return await withMongoDBSession(this._addSeasonWithSession, params)
  }

  static addEpisode = async (input: AddEpisodeInput) => {
    return await withMongoDBSession(this._addEpisodesWithSession, input)
  }

  static editVideo = async ({ vidId, type, changes }: EditVideoInput) => {
    const video = await VideoModel.findOne({ _id: vidId, type })

    if (video == null) {
      throw new OperationalError('video does not exist or does not exist as this type', 400)
    }

    delete changes['_id']

    const updatedVid = await VideoModel.findOneAndUpdate(
      {
        _id: vidId,
        type,
      },
      changes,
      {
        new: true,
      },
    )

    if (updatedVid == null) {
      throw new OperationalError('Could not update video or video does not exist', 404)
    }

    return updatedVid
  }

  static deleteVideo = async (vidId: string, type: AllVideoTypes) => {
    const deletedVid = await VideoModel.findOneAndDelete({ _id: vidId, type })

    if (deletedVid == null) {
      throw new OperationalError(`Not found or video is not a ${type} `, 404)
    }
  }

  static getVideos = async (
    type: AllVideoTypes,
    queryParams: QueryParamsFeaturesOptions['queryParams'],
  ) => {
    const page = handleDefaultNumAndUnknown(queryParams.page, 1)
    const limit = handleDefaultNumAndUnknown(queryParams.limit, 1)

    const vidsWithSources = await MovieMediaSourcesUtils.resolveMediaSources(
      await VideoRepo.fetchByType(type, page, limit),
      this.resolveWithMediaSources(queryParams),
      '720p',
    )

    return vidsWithSources
  }

  static getSeasonsAndEpisodes = async (
    vidSeriesId: string,
    queryParams: QueryParamsFeaturesOptions['queryParams'],
  ) => {
    const vid = await VideoModel.findById(vidSeriesId)

    if (vid == null) {
      throw new OperationalError('invalid video Id', 404)
    }

    if (!vid.is_series) {
      throw new OperationalError('video is not a series', 400)
    }

    const page = handleDefaultNumAndUnknown(queryParams.page, 1)
    const limit = handleDefaultNumAndUnknown(queryParams.limit, 10)

    const seasons = (await VideoRepo.fetchSeasonsAndEpisodes(vidSeriesId, page, limit)) as Season[]

    const seasonsWithMediaSources = await MovieMediaSourcesUtils.resolveSeasonsMediaSources(
      seasons,
      this.resolveWithMediaSources(queryParams),
      '720p',
      MovieMediaSourcesUtils.resolveEpisodesMediaSources,
    )

    return seasonsWithMediaSources
  }
}
