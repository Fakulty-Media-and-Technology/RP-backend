import { FilterQuery, PipelineStage, Types } from 'mongoose'
import { Video, VideoModel } from '../models/videos.model'
import { AllVideoTypes } from '../services/core/AdminUploadService'
import { skip } from '../utils/QueryParamsFeatures'
import { SeasonModel } from '../models/seasons.model'

export const toObjectId = (val: string) => new Types.ObjectId(val)

export type FetchVideosParams = {
  prevStages: PipelineStage[]
  sortStage?: PipelineStage.Sort
  page: number
  limit: number
}

export class VideoRepo {
  static addFeatured = (id: string, expiry: string) =>
    VideoModel.findByIdAndUpdate(id, {
      featured: true,
      feat_expiry: new Date(expiry),
    })

  static totalVideosCountQuery = (filter: FilterQuery<Video> = {}) =>
    VideoModel.find(filter).countDocuments()

  static totalMovieSeriesCountQuery = () =>
    this.totalVideosCountQuery({ type: { $in: ['movie', 'series'] } })

  static totalMusicVideosCountQuery = () => this.totalVideosCountQuery({ type: 'music-video' })

  static totalSkitVideosCOuntQuery = () => this.totalVideosCountQuery({ type: 'skit' })

  // static searchTitleOrDescriptionByTextReg = (textReg: RegExp) =>
  //   VideoModel.find({
  //     $or: [{ title: { $regex: textReg } }, { description: { $regex: textReg } }],
  //   })

  static searchTitleOrDescriptionByTextReg = async (textReg: RegExp, page = 1, limit = 10) => {
    return await this.fetchVideoAggr({
      prevStages: [
        {
          $match: {
            $or: [{ title: { $regex: textReg } }, { description: { $regex: textReg } }],
          },
        },
      ],
      sortStage: { $sort: { createdAt: -1 } },
      page,
      limit,
    })
  }

  private static _mostEngagedPrevStages: PipelineStage[] = [
    {
      $lookup: {
        from: 'comments',
        foreignField: 'parentId',
        localField: '_id',
        as: 'comments',

        pipeline: [{ $match: { parentType: 'vod' } }],
      },
    },
    {
      $lookup: {
        from: 'ratings',
        foreignField: 'parentId',
        localField: '_id',
        as: 'ratings',

        pipeline: [
          { $match: { parentType: 'vod' } },
          { $group: { _id: null, totalRatings: { $sum: '$rate' } } },
        ],
      },
    },
    {
      $addFields: {
        enagements: {
          $sum: [
            { $size: '$likes' },
            { $size: '$comments' },
            { $ifNull: [{ $first: '$ratings.totalRatings' }, 0] },
          ],
        },
      },
    },
    { $sort: { enagements: -1 } },
    { $project: { ratings: false, comments: false, __v: false } },
  ]

  private static _episodesPipeline = [
    {
      $lookup: {
        from: 'sub_titles',
        localField: '_id',
        foreignField: 'video_id',
        as: 'subtitle',
        pipeline: [{ $project: { key: true, bucket: true, language: true } }],
      },
    },
    {
      $lookup: {
        from: 'video_uploads',
        localField: '_id',
        foreignField: 'parentId',
        as: 'videoUpload',
        pipeline: [
          { $match: { isTranscoded: true } },
          { $project: { key: true, isTranscoded: true, resolutions: true } },
        ],
      },
    },
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
      $lookup: {
        from: 'ratings',
        foreignField: 'parentId',
        localField: '_id',
        as: 'ratings',
        pipeline: [{ $group: { _id: null, avgRating: { $avg: '$rate' } } }],
      },
    },

    {
      $addFields: {
        trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
        videoUpload: { $ifNull: [{ $first: '$videoUpload' }, null] },
        subtitle: { $first: '$subtitle' },
        averageRating: { $ifNull: [{ $first: '$ratings.avgRating' }, 4.5] },
      },
    },
    {
      $project: {
        __v: false,
        ratings: false,
        trailer: false,
        subtitleUpload: false,
        trailerUpload: false,
      },
    },
  ]

  private static _seasonPipeline: PipelineStage[] = [
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
              pipeline: [{ $project: { key: true, isTranscoded: true, resolutions: true } }],
            },
          },

          { $addFields: { trailerVideoUpload: { $first: '$trailerVideoUpload' } } },
        ],
      },
    },
    {
      $lookup: {
        from: 'episodes',
        localField: '_id',
        foreignField: 'season',
        as: 'episodes',
        pipeline: this._episodesPipeline,
      },
    },

    {
      $addFields: {
        trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
        portraitPhoto: { $first: '$portraitPhoto' },
        landscapePhoto: { $first: '$landscapePhoto' },
      },
    },

    { $sort: { createdAt: -1 } },
    { $project: { __v: false, trailer: false } },
  ]

  static fetchSeasonsAndEpisodes = async (videoId: string, page: number, limit: number) => {
    const aggr = await SeasonModel.aggregate([
      {
        $match: { video: toObjectId(videoId) },
      },
      ...this._seasonPipeline,
      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: 'season',
          as: 'episodes',
          pipeline: this._episodesPipeline,
        },
      },

      { $sort: { createdAt: 1 } },
      { $skip: skip(page, limit) },
      { $limit: limit },
    ])

    return aggr
  }

  static fetchVideoAggr = async ({ prevStages, sortStage, page, limit }: FetchVideosParams) => {
    const enumsProjectShared: PipelineStage.Project = {
      $project: { __v: false, createdAt: false, updatedAt: false },
    }
    const sortPaginateStages: PipelineStage[] = [{ $skip: skip(page, limit) }, { $limit: limit }]

    if (sortStage) sortPaginateStages.unshift(sortStage)

    const aggr = await VideoModel.aggregate([
      ...prevStages,

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
        $lookup: {
          from: 'video_uploads',
          localField: '_id',
          foreignField: 'parentId',
          as: 'videoUpload',
          pipeline: [
            { $match: { isTranscoded: true } },
            { $project: { key: true, isTranscoded: true, resolutions: true } },
          ],
        },
      },

      {
        $lookup: {
          from: 'genre_enums',
          foreignField: '_id',
          localField: 'genre',
          as: 'genre',
          pipeline: [enumsProjectShared],
        },
      },

      {
        $lookup: {
          from: 'category_enums',
          foreignField: '_id',
          localField: 'category',
          as: 'category',
          pipeline: [enumsProjectShared],
        },
      },

      {
        $lookup: {
          from: 'cast_enums',
          foreignField: '_id',
          localField: 'cast',
          as: 'cast',
          pipeline: [enumsProjectShared],
        },
      },

      {
        $lookup: {
          from: 'sub_titles',
          localField: '_id',
          foreignField: 'video_id',
          as: 'subtitle',
          pipeline: [{ $project: { key: true, bucket: true, language: true } }],
        },
      },
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
        $lookup: {
          from: 'ratings',
          foreignField: 'parentId',
          localField: '_id',
          as: 'ratings',

          pipeline: [{ $group: { _id: null, avgRating: { $avg: '$rate' } } }],
        },
      },
      {
        $addFields: {
          vidClass: '$vid_class',
          artistName: '$artist_name',
          releaseDate: '$released_date',
          expiryDate: '$expiry_date',
          defaultRating: '$default_rating',
          trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
          videoUpload: { $ifNull: [{ $first: '$videoUpload' }, null] },
          portraitPhoto: { $first: '$portraitPhoto' },
          landscapePhoto: { $first: '$landscapePhoto' },
          subtitle: { $first: '$subtitle' },
          averageRating: { $ifNull: [{ $first: '$ratings.avgRating' }, 4.5] },
        },
      },

      {
        $match: {
          $or: [
            { type: 'series' },
            { $and: [{ videoLink: { $ne: null } }, { videoUpload: null }] },
            { $and: [{ videoLink: null }, { videoUpload: { $ne: null } }] },
          ],
        },
      },

      ...sortPaginateStages,

      {
        $lookup: {
          from: 'seasons',
          localField: '_id',
          foreignField: 'video',
          as: 'seasons',
          pipeline: this._seasonPipeline as any,
        },
      },
      {
        $project: {
          expiry_date: false,
          released_date: false,
          artist_name: false,
          subtitle_upload: false,
          vid_class: false,
          default_rating: false,
          ratings: false,
          is_series: false,
          trailer: false,
          trailer_upload: false,
          landscape_photo: false,
          portrait_photo: false,
          video_upload: false,
          __v: false,
          updatedAt: false,
        },
      },
    ])

    return aggr
  }

  static fetchByType = async (type: AllVideoTypes, page = 1, limit = 20) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { type } }],
      sortStage: { $sort: { createdAt: -1 } },
      page,
      limit,
    })
  }

  static fetchById = async (id: string) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { _id: toObjectId(id) } }],
      page: 1,
      limit: 1,
    })
  }

  static fetchFeatured = async (page = 1, limit = 10) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { featured: true } }],
      // sortStage: { $sort: { $natural: -1 } },
      page,
      limit,
    })
  }

  static fetchMostEngaged = async (page = 1, limit = 5) => {
    return await this.fetchVideoAggr({
      prevStages: this._mostEngagedPrevStages,
      sortStage: { $sort: { enagements: -1 } },
      page,
      limit,
    })
  }
}
