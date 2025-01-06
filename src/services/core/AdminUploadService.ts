import { Request } from 'express'
import { ClientSession, FilterQuery } from 'mongoose'
import { PosterImageModel } from '../../models/poster.model'

import {
  populateTranscodesWithSignedUrl,
  Video,
  VideoModel,
  VideoSchema,
  EpisodeSchema,
} from '../../models/videos.model'

import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'

export type AllVideoTypes = Video['type']

type PosterData = {
  bucket: string
  key: string
  dimension: string
}

type MakePostersInput = {
  videoId: string
  posterOne: PosterData
  posterTwo: PosterData
}

type AddVideoWithSessionInput = {
  adminId: string
  type: AllVideoTypes
  data: Record<string, any>
}

export class AdminUploadService {
  private static _makePosters = async (data: MakePostersInput, session: ClientSession) => {
    const posterOne = await new PosterImageModel({
      video_id: data.videoId,
      bucket: data.posterOne.bucket,
      key: data.posterOne.key,
      dimension: data.posterOne.dimension,
    }).save({ session })

    const posterTwo = await new PosterImageModel({
      video_id: data.videoId,
      bucket: data.posterTwo.bucket,
      key: data.posterTwo.key,
      dimension: data.posterTwo.dimension,
    }).save({ session })

    return {
      posterOne,
      posterTwo,
    }
  }

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

    const posters = await this._makePosters(
      {
        videoId: video.id,
        
        posterOne: {
          bucket: poster1_data.bucket,
          key: poster1_data.key,
          dimension: poster1_data.dimension,
        },

        posterTwo: {
          bucket: poster2_data.bucket,
          key: poster2_data.key,
          dimension: poster2_data.dimension,
        },
      },
      session,
    )

    return {
      video,
      ...posters,
    }
  }

  static addEpisode = async (vidId: string, episode: EpisodeSchema) => {
    const vid = await VideoModel.findOneAndUpdate(
      {
        _id: vidId,
        is_series: true,
        'episodes.episode_title': { $ne: episode.episode_title },
        'episodes.episode_number': { $ne: episode.episode_number },
      },
      { $push: { episodes: episode } },
    )

    if (vid === null) {
      throw new OperationalError(
        'Invalid ID or new episode has duplicate properties with previous episodes episode_title | key | episode_number',
        404,
      )
    }
  }

  static addVideo = async (params: {
    type: AllVideoTypes
    data: Record<string, any>
    adminId: string
  }) => {
    await withMongoDBSession(this._addVideoWithSession, params)
  }

  static editVideo = async ({
    vidId,
    type,
    changes,
  }: {
    vidId: string
    type: AllVideoTypes
    changes: Record<string, any>
  }) => {
    const video = await VideoModel.findOne({ _id: vidId, type })

    if (video == null) {
      throw new OperationalError('video does not exist or does not exist as this type', 400)
    }

    delete changes['_id']
    delete changes['admin_id']

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
    const filter: FilterQuery<VideoSchema> = {
      type,
      [type === 'series' ? 'episodes.key' : 'key']: { $regex: /^transcode/ },
    }

    const dbQuery = VideoModel.find(filter).sort('updatedAt').select('-__v -createdAt -updatedAt')

    const features = new QueryParamsFeatures(dbQuery, {
      defaultLimit: 10,
      defaultPage: 1,
      queryParams,
    })

    const videos = await features.paginate().query
    const settledResults = await Promise.allSettled(videos.map(populateTranscodesWithSignedUrl))
    const vids: any[] = []

    settledResults.forEach(result => {
      if (result.status === 'fulfilled') {
        vids.push(result.value)
      }
    })

    return vids
  }
}
