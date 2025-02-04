import { Request } from 'express'
import { ClientSession } from 'mongoose'
import { PosterImageModel } from '../../models/poster.model'

import { Video, VideoModel } from '../../models/videos.model'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { SeasonModel } from '../../models/seasons.model'
import { EpisodeModel } from '../../models/episodes.model'
import { VideoUploadParser } from '../../utils/VideoUploadParser'
import { MediaManagement, UploadAndTranscodeConfig } from '../media-management'
import { StringOrObjectId } from '../../types'
import { TrailerModel } from '../../models/trailer.model'
import { VideoUploadModel } from '../../models/videoupload.model'
import { SubtitleModel } from '../../models/subtitle.model'
import { videoUploadParents } from '../../models/assets'

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
}

type UploadAndSavePostersToDBParams = {
  portraitFile: Express.Multer.File
  landscapeFile: Express.Multer.File
  videoId: StringOrObjectId
}
type GetVideoUploadDoc = UploadAndTranscodeConfig & {
  parentType: (typeof videoUploadParents)[number]
  parentId: StringOrObjectId
}

const allowMimetype = (
  file: Express.Multer.File,
  type: 'image' | 'video' | 'text',
  msg: string,
) => {
  if (!file.mimetype.startsWith(type)) {
    throw new OperationalError(msg, 400)
  }
}

export class AdminUploadService {
  private static _getVideoUploadDoc = async (
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

  private static _uploadVideoPosters = async (
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

  private static _savePostersUploadToDb = async (
    { portraitPosterUpload, landscapePosterUpload, videoId }: SavePostersUploadToDBParams,
    session: ClientSession,
  ) => {
    // save portrait
    await new PosterImageModel({
      video_id: videoId,
      bucket: portraitPosterUpload.Bucket,
      key: portraitPosterUpload.Key,
      dimension: 'portrait',
    }).save({ session })

    // save landscape
    await new PosterImageModel({
      video_id: videoId,
      bucket: landscapePosterUpload.Bucket,
      key: landscapePosterUpload.Key,
      dimension: 'landscape',
    }).save({ session })
  }

  private static _uploadAndSavePostersToDB = async (
    { landscapeFile, portraitFile, videoId }: UploadAndSavePostersToDBParams,
    session: ClientSession,
  ) => {
    const { portraitUpload, landscapeUpload } = await this._uploadVideoPosters(
      portraitFile,
      landscapeFile,
    )

    //save to db
    await this._savePostersUploadToDb(
      {
        portraitPosterUpload: portraitUpload,
        landscapePosterUpload: landscapeUpload,
        videoId,
      },
      session,
    )
  }

  private static _uploadMovieOrSkitSession = async (
    { data, type, adminId }: AddVideoParams,
    session: ClientSession,
  ) => {
    allowMimetype(data.portraitPoster, 'image', 'portraitPoster must be an image')
    allowMimetype(data.landscapePoster, 'image', 'landscapePoster must be an image')
    data.subTitle && allowMimetype(data.subTitle, 'text', 'subTitle must be a text file')
    data.trailer && allowMimetype(data.trailer, 'video', ' trailer must be a video file')
    data.video && allowMimetype(data.video, 'video', 'video must be a video file')

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

    await this._uploadAndSavePostersToDB(
      {
        portraitFile: data.portraitPoster,
        landscapeFile: data.landscapePoster,
        videoId: videoDoc._id,
      },
      session,
    )

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

    if (data.trailer) {
      const trailerDoc = new TrailerModel({
        video_id: videoDoc._id,
        parentType: 'vod',
      })

      const tVidUploadDoc = await this._getVideoUploadDoc(
        {
          file: data.trailer,
          waitTranscode: false,
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
  }

  static addVideo = async (input: AddVideoParams) => {
    await withMongoDBSession(this._uploadMovieOrSkitSession, input)
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

  static getVideos = async (type: AllVideoTypes, queryParams: Request['query']) => {
    const dbQuery = VideoModel.find({ type }).sort('-createdAt').populate('seasons').populate({
      path: 'video_upload',
      select: 'resolutions key bucket isTranscoded',
    })

    const queryFeatures = new QueryParamsFeatures(dbQuery, {
      defaultLimit: 50,
      defaultPage: 1,
      queryParams,
    })

    const vids = await queryFeatures.paginate().query
    return VideoUploadParser.populateVideoVidUploadResolutions(vids)
  }

  // ********* seasons

  static addSeason = async (videoId: string, adminId: string) => {
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

    await SeasonModel.create({
      admin: adminId,
      video: videoId,
      serial_number: prevSeasons.length + 1,
    })
  }

  // ********* episodes
  private static _addEpisodesWithSession = async (
    { seasonId, data, adminId }: AddEpisodeInput,
    session: ClientSession,
  ) => {
    data.subTitle && allowMimetype(data.subTitle, 'text', 'subTitle must be a text file')
    data.trailer && allowMimetype(data.trailer, 'video', ' trailer must be a video file')
    data.video && allowMimetype(data.video, 'video', 'video must be a video file')

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

  static addEpisode = async (input: AddEpisodeInput) => {
    return await withMongoDBSession(this._addEpisodesWithSession, input)
  }
}
