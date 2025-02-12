import { FilterQuery, PipelineStage } from 'mongoose'
import { LiveModel, LiveSchema } from '../models/lives.model'
import { skip } from '../utils/QueryParamsFeatures'
import { toObjectId } from './VideoRepo'

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

  static getByStreamKey = async (streamKey: string) => {
    return await this.fetchLivesAggr({
      prevStages: [
        {
          $match: { stream_key: streamKey },
        },
      ],
      page: 1,
      limit: 1,
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
            expired: false,
          },
        },
      ],
      page,
      limit,
    })
  }

  static getSelectedLive = async (filter: FilterQuery<LiveSchema>, page = 1, limit = 10) => {
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

  static fetchLivesAggr = async ({ prevStages, sortStage, page, limit }: FetchLives) => {
    const sortPaginateStages: PipelineStage[] = [{ $skip: skip(page, limit) }, { $limit: limit }]

    if (sortStage) sortPaginateStages.unshift(sortStage)

    const aggr = await LiveModel.aggregate([
      ...prevStages,
      {
        $lookup: {
          from: 'poster_images',
          localField: '_id',
          foreignField: 'video_id',
          as: 'previewPhoto',
          pipeline: [{ $match: { dimension: 'live' } }, { $project: { key: true, bucket: true } }],
        },
      },
      {
        $lookup: {
          from: 'video_uploads',
          localField: '_id',
          foreignField: 'parentId',
          as: 'previewVideoUpload',
          pipeline: [
            { $match: { isTranscoded: true } },
            { $project: { key: true, isTranscoded: true, resolutions: true } },
          ],
        },
      },
      {
        $addFields: {
          vidClass: '$vid_class',
          coverPhoto: { $first: '$previewPhoto' },
          previewVideoUpload: { $ifNull: [{ $first: '$previewVideoUpload' }, null] },
          activeViews: '$active_views',
          featExpiry: '$feat_expiry',
          clientId: '$client_id',
        },
      },
      ...sortPaginateStages,
      {
        $project: {
          vid_class: false,
          previewPhoto: false,
          feat_expiry: false,
          active_views: false,
          client_id: false,
          __v: false,
        },
      },
    ])

    return aggr
  }

  static getMostEngaged = async (page = 1, limit = 5) => {
    return await this.fetchLivesAggr({
      prevStages: [
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

        { $sort: { engagements: -1 } },
        { $limit: 10 },
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
    })
  }
}
