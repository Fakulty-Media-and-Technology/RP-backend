import { FilterQuery, PipelineStage } from 'mongoose'
import { LiveModel, LiveSchema } from '../models/lives.model'
import { skip } from '../utils/QueryParamsFeatures'
import { toObjectId } from './VideoRepo'
import { MongoDBObjectId } from '../types/general'

type FetchLives = {
  prevStages: PipelineStage[]
  sortStage?: PipelineStage.Sort
  page: number
  limit: number
}

export class LiveRepo {
  static addFeatured = (id: string, expiry: string) => {
    return LiveModel.findByIdAndUpdate(id, {
      featured: true,
      feat_expiry: new Date(expiry),
    })
  }

  static totalActiveLiveQuery = () => LiveModel.find({ active: true })

  static fetchActiveUpcoming = async (page: number, limit: number) => {
    return await this.fetchLivesAggr({
      prevStages: [{ $match: { upcoming: true, active: true } }],
      page,
      limit,
    })
  }

  static fetchUpcoming = async (page: number, limit: number) => {
    return await this.fetchLivesAggr({
      prevStages: [{ $match: { upcoming: true } }],
      page,
      limit,
    })
  }

  static getChannels = async (page = 1, limit = 10) => {
    return await this.fetchLivesAggr({
      prevStages: [
        {
          $match: {
            type: 'channel',
          },
        },
      ],
      page,
      limit,
    })
  }

  static searchLivesByTextReg = async (textReg: RegExp, page = 1, limit = 10) => {
    return await this.fetchLivesAggr({
      prevStages: [
        {
          $match: {
            $or: [
              { title: { $regex: textReg } },
              { sub_title: { $regex: textReg } },
              { description: { $regex: textReg } },
            ],
          },
        },
      ],
      page,
      limit,
    })
  }

  static getFeatured = async (page = 1, limit = 10) => {
    return await this.fetchLivesAggr({
      prevStages: [{ $match: { featured: true, expired: false } }],
      page,
      limit,
    })
  }

  static fetchByIds = async (ids: MongoDBObjectId[]) => {
    return await this.fetchLivesAggr({
      prevStages: [{ $match: { _id: { $in: ids } } }],
      page: 1,
      limit: 2,
    })
  }

  static getActiveById = async (id: string, page = 1, limit = 10) => {
    return await this.fetchLivesAggr({
      prevStages: [{ $match: { _id: toObjectId(id), active: true } }],
      page,
      limit,
    })
  }

  static getValidClientLive = async (clientId: string, page = 1, limit = 10) => {
    return await this.fetchLivesAggr({
      prevStages: [
        {
          $match: {
            client_id: toObjectId(clientId),
            expiry: { $gte: new Date() },
          },
        },
      ],
      page,
      limit,
    })
  }

  static getSelectedLive = async (filter: FilterQuery<LiveSchema>, page = 1, limit = 10) => {
    if (filter.popular) {
      delete filter.popular
      return await this.getMostEngaged(page, limit, { $match: filter })
    }

    return await this.fetchLivesAggr({
      prevStages: [{ $match: filter }],
      page,
      limit,
    })
  }

  static fetchLivesByType = async (type: LiveSchema['type'], page: number, limit: number) => {
    return this.fetchLivesAggr({
      prevStages: [{ $match: { type } }],
      sortStage: { $sort: { createdAt: -1 } },
      page,
      limit,
    })
  }

  static fetchRandom = async (limit = 3) => {
    return this.fetchLivesAggr({
      prevStages: [{ $sample: { size: limit * 2 } }],
      sortStage: { $sort: { createdAt: -1 } },
      page: 1,
      limit,
    })
  }

  static fetchLivesAggr = async ({ prevStages, sortStage, page, limit }: FetchLives) => {
    const aggr = await LiveModel.aggregate([
      ...prevStages,

      {
        $lookup: {
          from: 'poster_images',
          localField: 'coverPhoto',
          foreignField: '_id',
          as: 'coverPhoto',
          pipeline: [{ $project: { key: true, bucket: true } }],
        },
      },

      {
        $lookup: {
          from: 'users',
          localField: 'client_id',
          foreignField: '_id',
          as: 'channelLogo',
          pipeline: [
            {
              $set: {
                hasPhoto: {
                  $cond: {
                    if: { $eq: [{ $ifNull: ['$photo', null] }, null] },
                    then: false,
                    else: true,
                  },
                },
              },
            },

            { $match: { $expr: { $eq: ['$hasPhoto', true] } } },

            {
              $project: {
                key: '$photo.Key',
                bucket: '$photo.Bucket',
                _id: '$$REMOVE',
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: 'video_uploads',
          localField: '_id',
          foreignField: 'parentId',
          as: 'previewVideoUploads',
          pipeline: [
            { $match: { isTranscoded: true } },
            { $project: { key: true, isTranscoded: true, resolutions: true } },
          ],
        },
      },

      {
        $lookup: {
          from: 'category_enums',
          foreignField: '_id',
          localField: 'category',
          as: 'category',
          pipeline: [
            {
              $project: { __v: false, createdAt: false, updatedAt: false },
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
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'client_id',
          foreignField: '_id',
          as: 'clientDetails',

          pipeline: [
            {
              $project: {
                fullName: { $concat: ['$first_name', ' ', '$last_name'] },
              },
            },
          ],
        },
      },
      {
        $addFields: {
          viewsCount: { $size: '$views' },
          streamKey: '$stream_key',
          vidClass: '$vid_class',
          coverPhoto: { $first: '$coverPhoto' },
          channelLogo: { $ifNull: [{ $first: '$channelLogo' }, null] },
          previewVideoUploadDoc: { $ifNull: [{ $first: '$previewVideoUploads' }, null] },
          activeViews: '$active_views',
          featExpiry: '$feat_expiry',
          clientDetails: { $first: '$clientDetails' },
        },
      },

      {
        $match: {
          $or: [{ previewVideoUpload: null }, { previewVideoUploadDoc: { $ne: null } }],
        },
      },

      sortStage ?? {
        $sort: { engagements: -1 },
      },

      { $skip: skip(page, limit) },
      { $limit: limit },

      {
        $lookup: {
          from: 'voteinfos',
          localField: '_id',
          foreignField: 'liveId',
          as: 'voteInfo',
          pipeline: [{ $unset: ['liveId', '__v'] }],
        },
      },

      {
        $set: {
          voteInfo: { $ifNull: [{ $first: '$voteInfo' }, null] },
        },
      },

      {
        $project: {
          views: false,
          previewVideoUploads: false,
          previewVideoUpload: false,
          stream_key: false,
          vid_class: false,
          feat_expiry: false,
          active_views: false,
          client_id: false,
          __v: false,
        },
      },
    ])

    return aggr
  }

  static getMostEngaged = async (
    page = 1,
    limit = 5,
    match: PipelineStage.Match = { $match: {} },
  ) => {
    return await this.fetchLivesAggr({
      prevStages: [
        match,
        {
          $lookup: {
            from: 'comments',
            foreignField: 'parentId',
            localField: '_id',
            as: 'comments',

            pipeline: [{ $match: { parentType: 'live' } }],
          },
        },
        {
          $lookup: {
            from: 'ratings',
            foreignField: 'parentId',
            localField: '_id',
            as: 'ratings',

            pipeline: [
              { $match: { parentType: 'live' } },
              { $group: { _id: null, totalRatings: { $sum: '$rate' } } },
            ],
          },
        },
        {
          $lookup: {
            from: 'votes',
            foreignField: 'live_id',
            localField: '_id',
            as: 'votes',
          },
        },
        {
          $lookup: {
            from: 'donates',
            foreignField: 'live_id',
            localField: '_id',
            as: 'donations',
          },
        },

        {
          $addFields: {
            engagements: {
              $sum: [
                { $size: '$views' },
                { $size: '$donations' },
                { $size: '$votes' },
                { $size: '$comments' },
                { $ifNull: [{ $first: '$ratings.totalRatings' }, 0] },
              ],
            },
          },
        },

        {
          $project: {
            donations: false,
            comments: false,
            ratings: false,
            votes: false,
            __v: false,
          },
        },
      ],

      page,
      limit,
      sortStage: { $sort: { engagements: -1 } },
    })
  }
}
