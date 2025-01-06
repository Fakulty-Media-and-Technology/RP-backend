import { Request } from 'express'
import { ClientSession } from 'mongoose'
import { PosterImageModel } from '../../models/poster.model'

import { Video, VideoModel } from '../../models/videos.model'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { SeasonModel } from '../../models/seasons.model'
import { EpisodeModel } from '../../models/episodes.model'
import { VideoParser } from '../../utils/VideoParser'
import { VideoUploadModel } from '../../models/videoupload.model'
import { VideoUploadRepo } from '../../repositories/VideoUploadRepo'

export type AllVideoTypes = Video['type']

type AddEpisodeInput = {
  seasonId: string
  data: Record<string, any>
  adminId: string
}

type AddVideoInput = {
  type: AllVideoTypes
  data: Record<string, any>
  adminId: string
}

type AddSeasonWithSessionInput = {
  videoId: string
  adminId: string
}

type EditVideoInput = {
  vidId: string
  type: AllVideoTypes
  changes: Record<string, any>
}

type AddVideoWithSessionInput = AddVideoInput

export class AdminUploadService {
  private static _addVideoWithSession = async (
    input: AddVideoWithSessionInput,
    session: ClientSession,
  ) => {
    const { poster1_data, poster2_data } = input.data

    const video = await new VideoModel({
      admin_id: input.adminId,
      type: input.type,
      ...input.data,
    }).save({ session })

    if (video.type !== 'series') {
      if (video.video_upload == null) {
        throw new OperationalError(`video_upload is required for ${video.type} videos`, 400)
      }

      await VideoUploadRepo.updateWithParent({
        id: video.video_upload.toString(),
        parentId: video._id.toString(),
        parentType: 'vod',
        session,
      })
    }

    const posterOne = await new PosterImageModel({
      video_id: video.id,
      bucket: poster1_data.bucket,
      key: poster1_data.key,
      dimension: poster1_data.dimension,
    }).save({ session })

    const posterTwo = await new PosterImageModel({
      video_id: video.id,
      bucket: poster2_data.bucket,
      key: poster2_data.key,
      dimension: poster2_data.dimension,
    }).save({ session })

    return {
      video,
      posterOne,
      posterTwo,
    }
  }

  static addVideo = async (input: AddVideoInput) => {
    return await withMongoDBSession(this._addVideoWithSession, input)
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

    // delete the
  }

  static getVideos = async (type: AllVideoTypes, queryParams: Request['query']) => {
    const dbQuery = VideoModel.find({ type }).sort('-createdAt').populate('seasons').populate({
      path: 'video_upload',
      select: 'resolutionUrls key bucket',
    })

    const queryFeatures = new QueryParamsFeatures(dbQuery, {
      defaultLimit: 50,
      defaultPage: 1,
      queryParams,
    })

    const vids = await queryFeatures.paginate().query
    await VideoParser.populateVidsWithResolutionUrls(vids, type)
    return vids
  }

  // ********* seasons

  private static _addSeasonWithSesson = async (
    { videoId, adminId }: AddSeasonWithSessionInput,
    session: ClientSession,
  ) => {
    const prevSeasons = await SeasonModel.find({ video: videoId })

    const season = await new SeasonModel({
      admin: adminId,
      video: videoId,
      serial_number: prevSeasons.length + 1,
    }).save({ session })

    const parentVideo = await VideoModel.findOneAndUpdate(
      { _id: videoId, is_series: true },
      { $push: { seasons: season._id } },
      { session },
    )

    if (parentVideo === null) {
      throw new OperationalError('video Id is invalid or the video is not a series', 400)
    }

    return season
  }

  static addSeason = async (videoId: string, adminId: string) => {
    return await withMongoDBSession(this._addSeasonWithSesson, {
      videoId,
      adminId,
    })
  }

  // ********* episodes
  private static _addEpisodesWithSession = async (
    { seasonId, data, adminId }: AddEpisodeInput,
    session: ClientSession,
  ) => {
    let episodeNumber: number

    if (data.episode_number) {
      episodeNumber = data.episode_number
    } else {
      const prevEpisodes = await EpisodeModel.find({ season: seasonId })
      episodeNumber = prevEpisodes.length + 1
    }

    const episode = await new EpisodeModel({
      ...data,
      episode_number: episodeNumber,
      season: seasonId,
      admin: adminId,
    }).save({ session })

    const parentSeason = await SeasonModel.findByIdAndUpdate(
      seasonId,
      { $push: { episodes: episode._id } },
      { session },
    )

    if (parentSeason == null) {
      throw new OperationalError('invalid season Id', 404)
    }

    await VideoUploadRepo.updateWithParent({
      id: episode.video_upload.toString(),
      parentId: episode._id.toString(),
      parentType: 'episode',
      session,
    })

    return episode
  }

  static addEpisode = async (input: AddEpisodeInput) => {
    return await withMongoDBSession(this._addEpisodesWithSession, input)
  }

  // static
}
