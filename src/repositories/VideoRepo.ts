import { FilterQuery, PipelineStage, Types } from 'mongoose'
import { Video, VideoModel } from '../models/videos.model'
import { skip } from '../utils/QueryParamsFeatures'
import { SeasonModel } from '../models/seasons.model'
import { AllVideoTypes } from '../utils/UploadMediaUtils'

export const toObjectId = (val: string) => new Types.ObjectId(val)

export type FetchVideosParams = {
  prevStages: PipelineStage[]
  sortStage?: PipelineStage.Sort
  fetchSeasons: boolean
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
          { $sort: { createdAt: -1 } },

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

  static fetchUpcoming = async (page = 1, limit = 10) => {
    return await this.fetchVideoAggr({
      prevStages: [
        {
          $match: { upcoming: true },
        },
      ],
      fetchSeasons: false,
      sortStage: { $sort: { createdAt: -1 } },
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
      fetchSeasons: false,
      sortStage: { $sort: { createdAt: -1 } },
      page,
      limit,
    })
  }

  static searchTitleOrDescriptionByTextReg = async (textReg: RegExp, page = 1, limit = 10) => {
    return await this.fetchVideoAggr({
      prevStages: [
        {
          $match: {
            $or: [{ title: { $regex: textReg } }, { description: { $regex: textReg } }],
          },
        },
      ],
      fetchSeasons: false,
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

  static fetchVideoAggr = async ({
    prevStages,
    sortStage,
    page,
    limit,
    fetchSeasons,
  }: FetchVideosParams) => {
    const enumsProjectShared: PipelineStage.Project = {
      $project: { __v: false, createdAt: false, updatedAt: false },
    }
    const sortPaginateStages: PipelineStage[] = [{ $skip: skip(page, limit) }, { $limit: limit }]

    if (sortStage) sortPaginateStages.unshift(sortStage)

    const allStages: PipelineStage[] = [
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
          vidClass: '$vid_class',
          artistName: '$artist_name',
          releaseDate: '$released_date',
          expiryDate: '$expiry_date',
          defaultRating: '$default_rating',
          trailerVideoUpload: { $ifNull: [{ $first: '$trailer.trailerVideoUpload' }, null] },
          videoUpload: { $ifNull: [{ $first: '$videoUpload' }, null] },
          portraitPhoto: { $first: '$portraitPhoto' },
          landscapePhoto: { $first: '$landscapePhoto' },
          averageRating: { $ifNull: [{ $first: '$ratings.avgRating' }, 4.5] },
        },
      },

      {
        $match: {
          $or: [
            // series can have vids and trailers properties as as null
            { is_series: true },

            // TODO: find a coincise way
            {
              // videoLink and videoUpload are not null on the same document
              // trailerLink and trailerVideoUpload are not null on the same document
              $and: [
                {
                  $or: [
                    { $and: [{ videoLink: { $ne: null } }, { videoUpload: null }] },
                    { $and: [{ videoLink: null }, { videoUpload: { $ne: null } }] },
                  ],
                },

                {
                  $or: [
                    { $and: [{ trailerLink: { $ne: null } }, { trailerVideoUpload: null }] },
                    { $and: [{ trailerLink: null }, { trailerVideoUpload: { $ne: null } }] },
                  ],
                },
              ],
            },
          ],
        },
      },
      ...sortPaginateStages,
      {
        $project: {
          expiry_date: false,
          views: false,
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
    ]

    if (fetchSeasons) {
      allStages.push({
        $lookup: {
          from: 'seasons',
          localField: '_id',
          foreignField: 'video',
          as: 'seasons',
          pipeline: this._seasonPipeline as any,
        },
      })
    }

    const aggr = await VideoModel.aggregate(allStages)
    return aggr
  }

  static fetchByCategory = async (catId: string, page: number, limit: number) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { category: toObjectId(catId) } }, ...this._mostEngagedPrevStages],
      sortStage: { $sort: { enagements: -1 } },
      fetchSeasons: false,
      page,
      limit,
    })
  }

  static fetchByType = async (type: AllVideoTypes, page = 1, limit = 20) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { type } }],
      sortStage: { $sort: { createdAt: -1 } },
      fetchSeasons: true,
      page,
      limit,
    })
  }

  static fetchById = async (id: string) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { _id: toObjectId(id) } }],
      fetchSeasons: true,
      page: 1,
      limit: 1,
    })
  }

  static fetchFeatured = async (page = 1, limit = 10) => {
    return await this.fetchVideoAggr({
      prevStages: [{ $match: { featured: true } }],
      fetchSeasons: false,
      page,
      limit,
    })
  }

  static fetchMostEngaged = async (page = 1, limit = 5) => {
    return await this.fetchVideoAggr({
      prevStages: this._mostEngagedPrevStages,
      sortStage: { $sort: { enagements: -1 } },
      fetchSeasons: false,
      page,
      limit,
    })
  }
}
