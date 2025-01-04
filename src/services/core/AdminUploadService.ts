import { ClientSession } from 'mongoose'
import { PosterImageModel } from '../../models/poster.model'
import { type Video, VideoModel } from '../../models/videos.model'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { MediaManagement } from '../../services/media-management'
import { MediaAccess } from '../../services/media-access'

import { Request } from 'express'

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
    await new PosterImageModel({
      video_id: data.videoId,
      bucket: data.posterOne.bucket,
      key: data.posterOne.key,
      dimension: data.posterOne.dimension,
    }).save({ session })

    await new PosterImageModel({
      video_id: data.videoId,
      bucket: data.posterTwo.bucket,
      key: data.posterTwo.key,
      dimension: data.posterTwo.dimension,
    }).save({ session })
  }

  private static _addVideoWithSession = async (
    input: AddVideoWithSessionInput,
    session: ClientSession,
  ) => {
    const { poster1_data, poster2_data } = input.data

    if (input.data.key && !!(await VideoModel.findOne({ key: input.data.key }))) {
      throw new OperationalError('Video with key already exists', 400)
    }

    const videoData = await new VideoModel({
      admin_id: input.adminId,
      type: input.type,
      ...input.data,
      is_series: input.type === 'series',
    }).save({ session })

    await this._makePosters(
      {
        videoId: videoData.id,
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
      throw new OperationalError('Could not update vide or video does not exist', 404)
    }

    return updatedVid
  }

  static deleteVideo = async (vidId: string, type: AllVideoTypes) => {
    const deletedVid = await VideoModel.findOneAndDelete({ _id: vidId, type })

    if (deletedVid == null) {
      throw new OperationalError(`Not found or video is not a ${type} `, 404)
    }

    if (deletedVid.is_series && deletedVid.episodes.length) {
      for (const { key, bucket } of deletedVid.episodes) {
        if (key && bucket) MediaManagement.deleteObject(key, bucket).catch(() => {})
      }
    }

    if (deletedVid.key && deletedVid.bucket) {
      MediaManagement.deleteObject(deletedVid.key, deletedVid.bucket).catch(() => {})
    }
  }

  static getVideos = async (type: AllVideoTypes, queryParams: Request['query']) => {
    const dbQuery = VideoModel.find({ type, is_transcodedKey: true })
      .sort({ updatedAt: 1 })
      .select('-__v -createdAt -updatedAt')

    const features = new QueryParamsFeatures(dbQuery, {
      defaultLimit: 10,
      defaultPage: 1,
      queryParams,
    })

    const videos = await features.paginate().query

    const settledResults = await Promise.allSettled(
      videos.map(async vid => {
        const video = vid.toObject()

        if (video.is_series) {
          for (const episode of video.episodes) {
            if (!episode.bucket) continue

            episode.transcodes = (await MediaAccess.getTranscodedSignedUrls(
              episode.bucket,
              episode.transcodes as any,
            )) as any
          }
        }

        if (video.bucket)
          video.transcodes = (await MediaAccess.getTranscodedSignedUrls(
            video.bucket,
            video.transcodes,
          )) as any

        return video
      }),
    )

    const vids: any[] = []

    settledResults.forEach(result => {
      if (result.status === 'fulfilled') {
        vids.push(result.value)
      }
    })

    return vids
  }
}
