import { Aggregate, FilterQuery, PipelineStage, Types } from 'mongoose'
import { Video, VideoModel } from '../models/videos.model'
import { skip } from '../utils/QueryParamsFeatures'
import { SeasonModel } from '../models/seasons.model'
import { AllVideoTypes } from '../utils/UploadMediaUtils'
import { MongoDBObjectId } from '../types/general'
import env from '../env'
import { MaybeSession } from '../utils/mongoDbSessionRunner'
import { StringOrObjectId } from '../types'

export const toObjectId = (val: string) => new Types.ObjectId(val)

export type FetchVideosParams = {
  prevStages: PipelineStage[]
  sortStage?: PipelineStage.Sort
  excludePreReleased?: boolean
  excludeExpired?: boolean
  populateCasts?: boolean
  page: number
  limit: number
}

export type AddSeasonUtilAggrRes = {
  _id: string
  isMovieSeries: boolean
  totalPreviousSeasons: number
  totalEpisodesOfLastSeason: number
  movieExpiryDate: Date | null
}

type FetchByCategAndCastParams = {
  catId: string
  genreId: string
  page: number
  limit: number
}

export type AddEpisodeUtilAggrRes = {
  _id: string
  seasonTrailerLink: null
  previousEpisodeTrailerLink: string | null
  previousEpisodeVideoLink: string | null
  isLastEpisodeVideoReady: boolean
  isLastEpisodeTrailerReady: boolean
  totalPreviousEpisodes: number
}

type FetchSimilarByCastIdInput = {
  castId: string
  vodToExcludeId: unknown
  page: number
  limit: number
}

type FetchSimilarByGenreIdInput = {
  genreId: string
  vodToExcludeId: unknown
  page: number
  limit: number
}

type ComputeTotalEngagementsInput = {
  session: MaybeSession
  id: StringOrObjectId
  property: 'likesCount' | 'commentsCount'
  by: number
}

export class VideoRepo {
  static computeEngagements = async ({
    session,
    id,
    property,
    by,
  }: ComputeTotalEngagementsInput) => {
    const update = await VideoModel.updateOne(
      { _id: id },
      [
        {
          $set: {
            [property]: { $add: [`$${property}`, by] },
          },
        },

        { $set: { engagements: { $add: ['$likesCount', '$commentsCount'] } } },
      ],
      { session },
    )

    return update
  }

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

  static totalSkitVideosCountQuery = () => this.totalVideosCountQuery({ type: 'skit' })

  static addSeasonUtilAggr = (videoId: string) => {
    const aggr = VideoModel.aggregate([
      { $match: { _id: toObjectId(videoId) } },

      {
        $lookup: {
          from: 'seasons',
          localField: '_id',
          foreignField: 'video',
          as: 'seasons',

          pipeline: [
            { $sort: { _id: -1 } },

            {
              $lookup: {
                from: 'episodes',
                localField: '_id',
                foreignField: 'season',
                as: 'episodes',
              },
            },
          ],
        },
      },

      {
        $project: {
          totalPreviousSeasons: { $size: '$seasons' },
          totalEpisodesOfLastSeason: { $size: { $ifNull: [{ $first: '$seasons.episodes' }, []] } },
          isMovieSeries: { $eq: ['$type', 'series'] },
          movieExpiryDate: { $ifNull: ['$expiryDate', null] },
        },
      },
    ])

    return aggr as Aggregate<(undefined | AddSeasonUtilAggrRes)[]>
  }

  static addEpisodeUtilAggr = async (seasonId: string) => {
    const aggr = await SeasonModel.aggregate([
      { $match: { _id: toObjectId(seasonId) } },

      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: 'season',
          as: 'episodes',

          pipeline: [
            { $sort: { _id: -1 } },

            {
              $project: {
                isTrailerReady: true,
                trailerLink: true,
                videoLink: true,
                isVideoReady: true,
              },
            },
          ],
        },
      },

      {
        $project: {
          previousEpisodeTrailerLink: {
            $ifNull: [{ $first: '$episodes.trailerLink' }, null],
          },

          previousEpisodeVideoLink: {
            $ifNull: [{ $first: '$episodes.videoLink' }, null],
          },

          isLastEpisodeTrailerReady: {
            $ifNull: [{ $first: '$episodes.isTrailerReady' }, false],
          },

          isLastEpisodeVideoReady: {
            $ifNull: [{ $first: '$episodes.isVideoReady' }, false],
          },

          totalPreviousEpisodes: { $size: '$episodes' },
        },
      },
    ])

    return aggr as Array<AddEpisodeUtilAggrRes>
  }

  static fetchByIds = async (ids: MongoDBObjectId[], page = 1, limit = 2) => {
    return await this.fetchVideoAggr({
      prevStages: [
        {
          $match: { _id: { $in: ids } },
        },
      ],

      sortStage: { $sort: { _id: -1 } },
      page,
      limit,
    })
  }

  static fetchUpcoming = async (page = 1, limit = 10) => {
    return await this.fetchVideoAggr({
      prevStages: [
        {
          $match: { releaseDate: { $gt: new Date() } },
        },
      ],

      // sortStage: { $sort: { _id: -1 } },
      page,
      limit,
    })
  }

  static fetchFromLatest = (page: number, limit: number) =>
    this.fetchVideoAggr({
      prevStages: [
        {
          $match: {},
        },
      ],

      sortStage: { $sort: { _id: -1 } },

      page,
      limit,
    })

  static fetchActiveUpcoming = async (page = 1, limit = 10) => {
    return await this.fetchVideoAggr({
      prevStages: [
        {
          $match: {
            releaseDate: { $gt: new Date() },

            // upcoming: true, // Unsure what these do
            active: true,
          },
        },
      ],

      excludePreReleased: false,
      // sortStage: { $sort: { _id: -1 } },
      page,
      limit,
    })
  }

  static searchVodContentByRegex = async (textReg: RegExp, page = 1, limit = 10) => {
    return await this.fetchVideoAggr({
      prevStages: [
        {
          $match: {
            $or: [
              { title: { $regex: textReg } },
              { description: { $regex: textReg } },
              { type: { $regex: textReg } },
            ],
          },
        },
      ],

      // sortStage: { $sort: { createdAt: -1 } },
      page,
      limit,
    })
  }

  static fetchSeasonsAndEpisodes = async (videoId: string, page: number, limit: number) => {
    const aggr = await SeasonModel.aggregate([
      {
        $match: { video: toObjectId(videoId) },
      },

      { $sort: { serial_number: 1 } },
      { $skip: skip(page, limit) },
      { $unset: '__v' },

      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: 'season',
          as: 'episodes',
          pipeline: [
            {
              $match: {
                isVideoReady: true,
                isTrailerReady: true,
              },
            },

            {
              $lookup: {
                from: 'video_uploads',
                localField: '_id',
                foreignField: 'parentId',
                as: 'videoUpload',
                pipeline: [
                  {
                    $project: {
                      parentType: true,
                      resolutions: true,
                    },
                  },
                  {
                    $facet: {
                      trailer: [
                        {
                          $match: {
                            parentType: 'episode-trailer',
                          },
                        },
                      ],
                      video: [
                        {
                          $match: {
                            parentType: 'episode',
                          },
                        },
                      ],
                    },
                  },

                  {
                    $set: {
                      trailer: { $first: '$trailer' },
                      video: { $first: '$video' },
                    },
                  },
                ],
              },
            },

            {
              $set: {
                trailerUpload: { $ifNull: [{ $first: '$videoUpload.trailer' }, null] },
                videoUpload: { $ifNull: [{ $first: '$videoUpload.video' }, null] },
              },
            },

            { $unset: ['isVideoReady', 'isTrailerReady', '__v'] },
          ],
        },
      },
    ])

    return aggr
  }

  protected static _fetchVideoEnumProjectionStage: PipelineStage.Project = {
    $project: {
      __v: false,
      createdAt: false,
      updatedAt: false,
    },
  }

  static _excludePreleasedVODSMatchStage: PipelineStage.Match = {
    $match: { $expr: { $lte: ['$releaseDate', '$$NOW'] } },
  }

  static _excludeExpiredVODSMatchSage: PipelineStage.Match = {
    $match: { $expr: { $gt: ['$expiryDate', '$$NOW'] } },
  }

  static fetchVideoAggr = ({
    prevStages,
    sortStage = {
      $sort: { engagements: -1 },
    },
    page,
    limit,
    excludePreReleased = true,
    excludeExpired = true,
    populateCasts = false,
  }: FetchVideosParams) => {
    const aggr = VideoModel.aggregate([
      ...(excludePreReleased ? [this._excludePreleasedVODSMatchStage] : []),
      ...(excludeExpired ? [this._excludeExpiredVODSMatchSage] : []),
      ...prevStages,

      {
        $match: {
          $or: [{ type: 'series' }, { $and: [{ isVideoReady: true }, { isTrailerReady: true }] }],
        },
      },

      {
        $set: {
          landscapePhoto: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$landscapePhoto.Key'] },
          portraitPhoto: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$portraitPhoto.Key'] },
        },
      },

      sortStage,

      { $skip: skip(page, limit) },
      { $limit: limit },

      {
        $lookup: {
          from: 'video_uploads',
          localField: '_id',
          foreignField: 'parentId',
          as: 'videoUpload',
          pipeline: [
            {
              $project: {
                parentType: true,
                resolutions: true,
              },
            },
            {
              $facet: {
                trailer: [
                  {
                    $match: {
                      parentType: 'vod-trailer',
                    },
                  },
                ],
                video: [
                  {
                    $match: {
                      parentType: 'vod',
                    },
                  },
                ],
              },
            },

            {
              $set: {
                trailer: { $first: '$trailer' },
                video: { $first: '$video' },
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: 'genre_enums',
          foreignField: '_id',
          localField: 'genre',
          as: 'genre',
          pipeline: [this._fetchVideoEnumProjectionStage],
        },
      },

      {
        $lookup: {
          from: 'category_enums',
          foreignField: '_id',
          localField: 'category',
          as: 'category',
          pipeline: [this._fetchVideoEnumProjectionStage],
        },
      },

      {
        $set: {
          videoUpload: { $ifNull: [{ $first: '$videoUpload.video' }, null] },
          trailerUpload: { $ifNull: [{ $first: '$videoUpload.trailer' }, null] },
        },
      },

      { $unset: ['updatedAt', '__v', 'ratings', 'isTrailerReady', 'isVideoReady'] },

      ...(populateCasts
        ? [
            {
              $lookup: {
                from: 'cast_enums',
                foreignField: '_id',
                localField: 'cast',
                as: 'cast',
                pipeline: [
                  {
                    $set: {
                      photoUrl: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$key'] },
                    },
                  },
                  { $unset: ['key', '__v', 'bucket'] },
                ],
              },
            },
          ]
        : []),
    ])

    return aggr as Aggregate<VodCardResponse[]>
  }

  static fetchSimilarByCastId = async ({
    castId,
    vodToExcludeId,
    page,
    limit,
  }: FetchSimilarByCastIdInput) => {
    const match: PipelineStage.Match = { $match: { cast: toObjectId(castId) } }

    if (typeof vodToExcludeId === 'string') {
      match.$match._id = { $ne: toObjectId(vodToExcludeId) }
    }

    return await this.fetchVideoAggr({
      prevStages: [match],
      page,
      limit,
      sortStage: { $sort: { _id: -1 } },
    })
  }

  static fetchSimilarByGenreId = ({
    genreId,
    vodToExcludeId,
    page,
    limit,
  }: FetchSimilarByGenreIdInput) => {
    const match: PipelineStage.Match = { $match: { genre: toObjectId(genreId) } }

    if (typeof vodToExcludeId === 'string') {
      match.$match._id = { $ne: toObjectId(vodToExcludeId) }
    }

    return this.fetchVideoAggr({
      prevStages: [match],
      page,
      limit,
      sortStage: { $sort: { _id: -1 } },
    })
  }

  static fetchByCategory = async (catId: string, page: number, limit: number) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { category: toObjectId(catId) } }],
      page,
      limit,
      sortStage: { $sort: { _id: -1 } },
    })
  }

  static adminFetchByType = async (type: AllVideoTypes, page = 1, limit = 20) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { type } }],
      // sortStage: { $sort: { _id: -1 } },
      excludeExpired: false,
      excludePreReleased: false,
      populateCasts: true,
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
      page,
      limit,
    })
  }

  static fetchMostEngaged = (page = 1, limit = 5) => {
    return this.fetchVideoAggr({
      prevStages: [],
      // sortStage: { $sort: { engagements: -1 } },
      page,
      limit,
    })
  }
  static fetchRandom = (limit = 3) => {
    return this.fetchVideoAggr({
      prevStages: [{ $sample: { size: limit * 2 } }],
      // sortStage: { $sort: { engagements: -1 } },
      page: 1,
      limit,
    })
  }

  static fetchByCategAndCast = ({ catId, genreId, page, limit }: FetchByCategAndCastParams) => {
    return this.fetchVideoAggr({
      prevStages: [
        {
          $match: {
            category: toObjectId(catId),
            genre: toObjectId(genreId),
          },
        },
      ],

      page,
      limit,
      sortStage: { $sort: { _id: -1 } },
    })
  }
}

export interface VodCardResponse {
  _id: string
  adminId: string
  title: string
  type: string
  videoUpload?: VideoUpload
  trailerUpload?: VideoUpload
  primaryColor: string
  vidClass: string
  pg: string
  genre: any[]
  category: any[]
  cast: any[]
  releaseDate: string
  expiryDate: string
  likes: any[]
  runtime: string
  defaultRating: number
  featured: boolean
  upcoming: boolean
  upcomingSubscribers: any[]
  videoLink: null | string
  trailerLink: null | string
  artistName: string
  active: boolean
  showViews: boolean
  landscapePhoto: string
  portraitPhoto: string
  createdAt: string
  viewsCount: number
  averageRating: number
}

export interface VideoUpload {
  resolutions: Resolution[]
}

interface Resolution {
  resolution: string
  key: string
}
