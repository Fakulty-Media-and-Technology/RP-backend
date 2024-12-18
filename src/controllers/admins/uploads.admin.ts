import { ClientSession } from 'mongoose'
import { PosterImageModel } from '../../models/poster.model'
import { type Video, VideoModel } from '../../models/videos.model'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'

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
  private static _validateInput = (type: AllVideoTypes, data: Record<string, any>) => {
    const {
      title,
      sub_title,
      bucket,
      key,
      pg,
      vid_class,
      category,
      genre,
      cast,
      released_date,
      expiry_date,
      runtime,
      default_rating,
      poster1_data,
      poster2_data,
      artist_name,
      episodes,
    } = data

    if (
      !title ||
      !key ||
      !pg ||
      !vid_class ||
      !category ||
      !released_date ||
      !runtime ||
      !default_rating
    ) {
      throw new OperationalError('all required fields are mandatory', 400)
    }

    if (
      !poster1_data.key ||
      !poster1_data.dimension ||
      !poster2_data.key ||
      !poster2_data.dimension
    ) {
      throw new OperationalError('video poster details are required', 400)
    }

    switch (type) {
      case 'series':
        if (
          typeof episodes === undefined ||
          typeof genre === undefined ||
          typeof cast === undefined
        ) {
          throw new OperationalError(
            'episodes, cast and genres are required when uploading series',
            400,
          )
        }
        break
      case 'music video':
        if (typeof artist_name === undefined || typeof bucket === undefined) {
          throw new OperationalError(
            'artist_name and bucket are required when uploading series',
            400,
          )
        }
        break

      default:
        if (
          typeof genre === undefined ||
          typeof cast === undefined ||
          typeof bucket === undefined
        ) {
          throw new OperationalError(
            'cast and genre and bucket are required when uploading movies or skits',
            400,
          )
        }
        break
    }
  }

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
    this._validateInput(input.type, input.data)

    const { poster1_data, poster2_data } = input.data

    const videoData = await new VideoModel({
      admin_id: input.adminId,
      type: input.type,
      ...input.data,
      is_series: input.type === 'series',
    }).save({ session })

    const makePostersParams: MakePostersInput = {
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
    }

    await this._makePosters(makePostersParams, session)
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

      const initData = await VideoModel.findOne({ _id: vid_id, type })

      if (initData == null) {
        throw new OperationalError('video does not exist or does not exist as this type', 400)
      }

      const requestData = req.body as Record<string, any>
      const initDataObject = initData.toObject()
      const update: Record<string, any> = {}

      Object.entries(initDataObject).forEach(([key, value]) => {
        if (key === '_id') return

        const requestDataValue = requestData[key]
        update[key] = typeof requestDataValue !== undefined ? requestDataValue : value
      })

      const updatedVid = await VideoModel.findOneAndUpdate(
        {
          _id: vid_id,
          type,
        },
        update,
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

  static deleteVideoByType = (_: AllVideoTypes) =>
    Catch.async(async (req, res) => {
      const vid_id = req.params.id

      // const deletedVid = await VideoModel.findOneAndDelete({ _id: vid_id, type })

      // if (deletedVid == null) {
      //   throw new OperationalError('Not found', 404)
      // }

      sendResponse({
        res,
        message: 'TODO',
      })

      //TODO delete S3 objecttsss
    })
}
