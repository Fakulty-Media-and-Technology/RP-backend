import { ClientSession } from 'mongoose'
import { PosterImageModel } from '../../models/poster.model'
import { type Video, VideoModel } from '../../models/videos.model'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { MediaManagement } from '../../services/media-management'

type AllVideoTypes = Video['type']

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

export class AdminUploadController {
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

  static addVideoByType = (type: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      const admin = GetDefined.loggedInUser(req.user)

      await withMongoDBSession(this._addVideoWithSession, {
        type,
        data: req.body,
        adminId: admin.id,
      })

      sendResponse({
        res,
        message: `${type} added successfully`,
      })
    })

  static editVideoByType = (type: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      const vid_id = req.params.id

      const video = await VideoModel.findOne({ _id: vid_id, type })

      if (video == null) {
        throw new OperationalError('video does not exist or does not exist as this type', 400)
      }

      const requestData = req.body as Record<string, any>

      delete requestData['_id']
      delete requestData['admin_id']

      const updatedVid = await VideoModel.findOneAndUpdate(
        {
          _id: vid_id,
          type,
        },
        requestData,
        {
          new: true,
        },
      )

      sendResponse({
        res,
        data: updatedVid,
        message: `${type} edited successfully`,
      })
    })

  static fetchVideosByType = (type: AllVideoTypes) =>
    Catch.async(async ({ query }, res) => {
      const dbQuery = VideoModel.find({ type })
        .select('-__v -createdAt -updatedAt')
        .sort({ updatedAt: 1 })

      const features = new QueryParamsFeatures(dbQuery, {
        defaultLimit: 10,
        defaultPage: 1,
        queryParams: query,
      })

      const videos = await features.paginate().query

      sendResponse({
        res,
        message: `${type}s fetched successfully`,
        data: videos,
      })
    })

  static deleteVideoByType = (type: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      const vid_id = req.params.id

      const deletedVid = await VideoModel.findOneAndDelete({ _id: vid_id, type })

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

      sendResponse({
        res,
        message: `${type} deleted successfully`,
      })
    })
}
