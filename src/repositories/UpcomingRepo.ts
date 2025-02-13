import { PipelineStage } from 'mongoose'
import { UpcomingModel } from '../models/upcoming.model'
import { skip } from '../utils/QueryParamsFeatures'

type FetchAggrOptions = {
  prevStages: PipelineStage[]
  page: number
  limit: number
}

export class UpcomingRepo {
  static fetchAggr = async ({ prevStages, page, limit }: FetchAggrOptions) => {
    const aggr = await UpcomingModel.aggregate([
      ...prevStages,
      {
        $lookup: {
          from: 'trailers',
          localField: '_id',
          foreignField: 'video_id',
          as: 'trailer',
          pipeline: [
            {
              $lookup: {
                from: 'video_uploads',
                localField: '_id',
                foreignField: 'parentId',
                as: 'trailerVideoUpload',
                pipeline: [
                  { $match: { isTranscoded: true } },
                  { $project: { key: true, isTranscoded: true, resolutions: true } },
                ],
              },
            },

            { $addFields: { trailerVideoUpload: { $first: '$trailerVideoUpload' } } },
          ],
        },
      },

      {
        $addFields: {
          trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
        },
      },

      { $match: { trailerVideoUpload: { $ne: null } } },

      { $sort: { updatedAt: -1 } },
      { $skip: skip(page, limit) },
      { $limit: limit },

      {
        $lookup: {
          from: 'poster_images',
          localField: '_id',
          foreignField: 'video_id',
          as: 'landscapePhoto',
          pipeline: [
            { $match: { dimension: 'landscape' } },
            { $project: { key: true, bucket: true } },
          ],
        },
      },
      {
        $lookup: {
          from: 'poster_images',
          localField: '_id',
          foreignField: 'video_id',
          as: 'portraitPhoto',
          pipeline: [
            { $match: { dimension: 'portrait' } },
            { $project: { key: true, bucket: true } },
          ],
        },
      },

      {
        $addFields: {
          trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
          portraitPhoto: { $first: '$portraitPhoto' },
          landscapePhoto: { $first: '$landscapePhoto' },
        },
      },

      { $project: { __v: false, trailer: false } },
    ])

    return aggr
  }
}
