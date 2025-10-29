import { Aggregate, FilterQuery, PipelineStage, Types } from 'mongoose'
import { Video, VideoModel } from '../models/videos.model'
import { skip } from '../utils/QueryParamsFeatures'
import { SeasonModel } from '../models/seasons.model'
import { AllVideoTypes } from '../utils/UploadMediaUtils'
import { EpisodeModel } from '../models/episodes.model'
import { MongoDBObjectId } from '../types/general'
import env from '../env'

export const toObjectId = (val: string) => new Types.ObjectId(val)

export type FetchVideosParams = {
  prevStages: PipelineStage[]
  sortStage?: PipelineStage.Sort
  excludePreReleased?: boolean
  excludeExpired?: boolean
  // fetchSeasons: boolean
  page: number
  limit: number
}

export type AddSeasonUtilAggrRes = {
  _id: string
  isMovieSeries: boolean
  totalPreviousSeasons: number
  totalEpisodesOfLastSeason: number
  movieExpiryDate: Date | undefined
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
  recentEpisodeTrailerLink: boolean
  recentEpisodeVideoLink: boolean
  isTrailerUploadVidTranscoded: boolean
  isRecentEpisodeTrailerVidUploadTranscoded: boolean
  isRecentEpisodeVidUploadTranscoded: boolean
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

  static totalSkitVideosCountQuery = () => this.totalVideosCountQuery({ type: 'skit' })

  static addSeasonUtilAggr = async (vidId: string) => {
    const aggr = await VideoModel.aggregate([
      { $match: { _id: toObjectId(vidId) } },

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
          isMovieSeries: '$is_series',
          movieExpiryDate: { $ifNull: ['$expiry_date', undefined] },
        },
      },
    ])

    return aggr as Array<AddSeasonUtilAggrRes>
  }

  static addEpisodeUtilAggr = async (seasonId: string) => {
    const seasonTrailerLookupStage: PipelineStage.Lookup = {
      $lookup: {
        from: 'trailers',
        localField: 'trailer',
        foreignField: '_id',
        as: 'trailer',

        pipeline: [
          {
            $lookup: {
              from: 'video_uploads',
              localField: 'video_upload',
              foreignField: '_id',
              as: 'trailerVidUpload',
            },
          },
          {
            $addFields: {
              isTrailerVidTranscoded: {
                $ifNull: [{ $first: '$trailerVidUpload.isTranscoded' }, null],
              },
            },
          },
        ],
      },
    }

    const episodesLookupStage: PipelineStage.Lookup = {
      $lookup: {
        from: 'episodes',
        localField: '_id',
        foreignField: 'season',
        as: 'episodes',

        pipeline: [
          { $sort: { _id: -1 } },

          {
            $lookup: {
              from: 'video_uploads',
              localField: 'videoUpload',
              foreignField: '_id',
              as: 'videoUploads',
            },
          },
          {
            $lookup: {
              from: 'trailers',
              localField: 'trailerUpload',
              foreignField: '_id',
              as: 'episodeTrailers',

              pipeline: [
                {
                  $lookup: {
                    from: 'video_uploads',
                    localField: 'video_upload',
                    foreignField: '_id',
                    as: 'episodeTrailerVidUpload',
                  },
                },

                {
                  $addFields: {
                    isEpisodeTrailerVidTranscoded: {
                      $ifNull: [{ $first: '$episodeTrailerVidUpload.isTranscoded' }, null],
                    },
                  },
                },
              ],
            },
          },

          {
            $addFields: {
              isEpisodeVidUploadTranscoded: {
                $ifNull: [{ $first: '$videoUploads.isTranscoded' }, null],
              },
              isTrailerVidUploadTranscoded: {
                $ifNull: [{ $first: '$episodeTrailers.isEpisodeTrailerVidTranscoded' }, null],
              },
            },
          },
        ],
      },
    }

    const aggr = await SeasonModel.aggregate([
      { $match: { _id: toObjectId(seasonId) } },
      seasonTrailerLookupStage,
      episodesLookupStage,

      {
        $project: {
          seasonTrailerLink: '$trailerLink',

          recentEpisodeTrailerLink: {
            $ifNull: [{ $first: '$episodes.trailerLink' }, null],
          },

          recentEpisodeVideoLink: {
            $ifNull: [{ $first: '$episodes.videoLink' }, null],
          },

          isTrailerUploadVidTranscoded: {
            $ifNull: [{ $first: '$trailer.isTrailerVidTranscoded' }, null],
          },

          isRecentEpisodeTrailerVidUploadTranscoded: {
            $ifNull: [{ $first: '$episodes.isTrailerVidUploadTranscoded' }, null],
          },

          isRecentEpisodeVidUploadTranscoded: {
            $ifNull: [{ $first: '$episodes.isEpisodeVidUploadTranscoded' }, null],
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
          $match: { upcoming: true },
        },
      ],

      sortStage: { $sort: { _id: -1 } },
      page,
      limit,
    })
  }

  static fetchActiveUpcoming = async (page = 1, limit = 10) => {
    return await this.fetchVideoAggr({
      prevStages: [
        {
          $match: { upcoming: true, active: true },
        },
      ],

      sortStage: { $sort: { createdAt: -1 } },
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
        engagements: {
          $sum: [
            { $size: '$likes' },
            { $size: '$comments' },
            { $ifNull: [{ $first: '$ratings.totalRatings' }, 0] },
          ],
        },
      },
    },
    { $sort: { engagements: -1 } },
    { $project: { ratings: false, comments: false, __v: false } },
  ]

  private static _episodesPipeline = [
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
      $lookup: {
        from: 'views',
        foreignField: 'content',
        localField: '_id',
        as: 'views',
      },
    },

    {
      $addFields: {
        viewsCount: { $size: '$views' },
        trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
        videoUpload: { $ifNull: [{ $first: '$videoUpload' }, null] },
        averageRating: { $ifNull: [{ $first: '$ratings.avgRating' }, 4.5] },
      },
    },
    {
      $project: {
        __v: false,
        ratings: false,
        views: false,
        trailer: false,
        subtitleUpload: false,
        trailerUpload: false,
      },
    },
  ]

  private static _seasonPipeline: PipelineStage[] = [
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
      $lookup: {
        from: 'views',
        foreignField: 'content',
        localField: '_id',
        as: 'views',
      },
    },

    {
      $addFields: {
        viewsCount: { $size: '$views' },
      },
    },

    { $sort: { createdAt: -1 } },
    { $project: { __v: false, trailer: false, views: false } },
  ]

  protected static _fetchEpisode = ({
    prevStages,
    limit,
    skip,
  }: {
    prevStages: PipelineStage[]
    limit: number
    skip: number
  }) => {
    //
    const res = EpisodeModel.aggregate([
      ...prevStages,
      ...this._episodesPipeline,
      { $sort: { _id: 1 } },
      { $skip: skip },
      { $limit: limit },
    ])

    return res
  }

  static fetchEpisodeById = (id: string) => {
    return this._fetchEpisode({
      skip: 0,
      limit: 1,
      prevStages: [
        {
          $match: { _id: toObjectId(id) },
        },
      ],
    })
  }

  static fetchSeasonsAndEpisodes = async (videoId: string, page: number, limit: number) => {
    const aggr = await SeasonModel.aggregate([
      {
        $match: { video: toObjectId(videoId) },
      },
      ...this._seasonPipeline,
      { $sort: { _id: 1 } },
      { $skip: skip(page, limit) },
      { $limit: limit },
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
      $sort: { _id: -1 },
    },
    page,
    limit,
    excludePreReleased = true,
    excludeExpired = true,
  }: FetchVideosParams) => {
    const aggr = VideoModel.aggregate([
      ...(excludePreReleased ? [this._excludePreleasedVODSMatchStage] : []),
      ...(excludeExpired ? [this._excludeExpiredVODSMatchSage] : []),
      ...prevStages,

      {
        $lookup: {
          from: 'video_uploads',
          localField: 'videoUpload',
          foreignField: '_id',
          as: 'videoUpload',
          pipeline: [
            {
              $match: {
                parentType: 'vod',
                isTranscoded: true,
              },
            },
            {
              $project: {
                resolutions: true,
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: 'video_uploads',
          localField: 'trailerUpload',
          foreignField: '_id',
          as: 'trailerUpload',
          pipeline: [
            {
              $match: {
                parentType: 'trailer',
                isTranscoded: true,
              },
            },
            {
              $project: {
                resolutions: true,
              },
            },
          ],
        },
      },

      {
        $set: {
          trailerUpload: { $first: '$trailerUpload' },
          videoUpload: { $first: '$videoUpload' },
        },
      },

      {
        $match: {
          $or: [
            // series can have vids and trailers properties as null
            { type: 'series' },

            {
              // videoLink and videoUpload are not null on the same document
              // trailerLink and trailer are not null on the same document
              $and: [
                {
                  $or: [{ videoLink: { $exists: true } }, { videoUpload: { $exists: true } }],
                },

                {
                  $or: [{ trailerLink: { $exists: true } }, { trailerUpload: { $exists: true } }],
                },
              ],
            },
          ],
        },
      },

      {
        $set: {
          landscapePhoto: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$landscapePhoto.Key'] },
          portraitPhoto: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$portraitPhoto.Key'] },
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
        $lookup: {
          from: 'cast_enums',
          foreignField: '_id',
          localField: 'cast',
          as: 'cast',
          pipeline: [this._fetchVideoEnumProjectionStage],
        },
      },

      {
        $lookup: {
          from: 'ratings',
          foreignField: 'parentId',
          localField: '_id',
          as: 'ratings',

          pipeline: [
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$rate' },
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: 'views',
          foreignField: 'content',
          localField: '_id',
          as: 'views',
          pipeline: [{ $count: 'total' }],
        },
      },

      {
        $addFields: {
          viewsCount: { $ifNull: [{ $first: '$views.total' }, 0] },
          averageRating: { $ifNull: [{ $first: '$ratings.avgRating' }, 4.5] },
        },
      },

      sortStage,
      { $skip: skip(page, limit) },
      { $limit: limit },

      {
        $project: {
          views: false,
          ratings: false,
          __v: false,
          updatedAt: false,
        },
      },
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
      prevStages: [match, ...this._mostEngagedPrevStages],
      sortStage: { $sort: { engagements: -1 } },
      page,
      limit,
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
      prevStages: [match, ...this._mostEngagedPrevStages],
      sortStage: { $sort: { engagements: -1 } },
      page,
      limit,
    })
  }

  static fetchByCategory = async (catId: string, page: number, limit: number) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { category: toObjectId(catId) } }, ...this._mostEngagedPrevStages],
      sortStage: { $sort: { engagements: -1 } },
      page,
      limit,
    })
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
      page,
      limit,
    })
  }

  static fetchMostEngaged = (page = 1, limit = 5) => {
    return this.fetchVideoAggr({
      prevStages: this._mostEngagedPrevStages,
      sortStage: { $sort: { engagements: -1 } },
      page,
      limit,
    })
  }
  static fetchRandom = (limit = 3) => {
    return this.fetchVideoAggr({
      prevStages: [{ $sample: { size: limit * 2 } }, ...this._mostEngagedPrevStages],
      sortStage: { $sort: { engagements: -1 } },
      page: 1,
      limit,
    })
  }

  static fetchByCategAndCast = ({ catId, genreId, page, limit }: FetchByCategAndCastParams) => {
    return this.fetchVideoAggr({
      prevStages: [
        { $match: { category: toObjectId(catId), genre: toObjectId(genreId) } },
        ...this._mostEngagedPrevStages,
      ],
      sortStage: { $sort: { engagements: -1 } },
      page,
      limit,
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
  _id: string
  resolutions: Resolution[]
}

interface Resolution {
  resolution: string
  key: string
}
