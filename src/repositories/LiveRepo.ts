import { Aggregate, FilterQuery, PipelineStage } from 'mongoose'
import { LiveModel, LiveSchema } from '../models/lives.model'
import { skip } from '../utils/QueryParamsFeatures'
import { toObjectId } from './VideoRepo'
import { MongoDBObjectId, WithMongoDBObjectID } from '../types/general'
import env from '../env'

type FetchLives = {
  prevStages: PipelineStage[]
  sortStage?: PipelineStage.Sort
  excludeExpired?: boolean
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

  static get24hReminderDocuments = (skip: number, limit: number) =>
    LiveModel.aggregate([
      {
        $match: {
          reminder24hSentAt: null,
          $expr: {
            $and: [
              {
                $gte: [
                  '$start',
                  {
                    $dateAdd: {
                      startDate: '$$NOW',
                      unit: 'hour',
                      amount: 24,
                    },
                  },
                ],
              },

              {
                $lt: [
                  '$start',
                  {
                    $dateAdd: {
                      startDate: '$$NOW',
                      unit: 'hour',
                      amount: 25,
                    },
                  },
                ],
              },
            ],
          },
        },
      },

      {
        $project: {
          start: true,
          title: true,
          coverPhoto: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$coverPhoto.Key'] },
        },
      },
      { $sort: { start: 1 } },

      { $skip: skip },
      { $limit: limit },
    ]) as Aggregate<
      WithMongoDBObjectID<Pick<LiveSchema, 'start' | 'title'> & { coverPhoto?: string }>[]
    >

  static get1hReminderDocuments = (skip: number, limit: number) =>
    LiveModel.aggregate([
      {
        $match: {
          reminder1hSentAt: null,
          $expr: {
            $and: [
              {
                $gte: [
                  '$start',
                  {
                    $dateAdd: {
                      startDate: '$$NOW',
                      unit: 'hour',
                      amount: 1,
                    },
                  },
                ],
              },

              {
                $lt: [
                  '$start',
                  {
                    $dateAdd: {
                      startDate: '$$NOW',
                      unit: 'hour',
                      amount: 2,
                    },
                  },
                ],
              },
            ],
          },
        },
      },

      {
        $project: {
          start: true,
          title: true,
          coverPhoto: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$coverPhoto.Key'] },
        },
      },
      { $sort: { start: 1 } },

      { $skip: skip },
      { $limit: limit },
    ]) as Aggregate<
      WithMongoDBObjectID<Pick<LiveSchema, 'start' | 'title'> & { coverPhoto?: string }>[]
    >

  static get10MinutesReminderDocuments = (skip: number, limit: number) =>
    LiveModel.aggregate([
      {
        $match: {
          reminder10mSentAt: null,
          $expr: {
            $and: [
              {
                $gte: [
                  '$start',
                  {
                    $dateAdd: {
                      startDate: '$$NOW',
                      unit: 'minute',
                      amount: 10,
                    },
                  },
                ],
              },
              {
                $lt: [
                  '$start',
                  {
                    $dateAdd: {
                      startDate: '$$NOW',
                      unit: 'minute',
                      amount: 12,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $project: {
          start: true,
          title: true,
          coverPhoto: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$coverPhoto.Key'] },
        },
      },
      { $sort: { start: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]) as Aggregate<
      WithMongoDBObjectID<Pick<LiveSchema, 'start' | 'title'> & { coverPhoto?: string }>[]
    >

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

  static getValidClientLive = async (_: string, page: number, limit: number) => {
    return await this.fetchLivesAggr({
      prevStages: [
        // {
        //   $match: {
        //     client_id: toObjectId(clientId),
        //     expiry: { $gte: new Date() },
        //   },
        // },
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
      // sortStage: { $sort: { createdAt: -1 } },
      page,
      limit,
    })
  }

  static fetchRandom = async (limit = 3) => {
    return this.fetchLivesAggr({
      prevStages: [{ $sample: { size: limit * 2 } }],
      // sortStage: { $sort: { createdAt: -1 } },
      page: 1,
      limit,
    })
  }

  static fetchLivesAggr = ({
    prevStages,
    sortStage,
    page,
    limit,
    excludeExpired = true,
  }: FetchLives) => {
    const aggr = LiveModel.aggregate([
      ...(excludeExpired
        ? [
            {
              $match: { $expr: { $gt: ['$expiry', '$$NOW'] } },
            },
          ]
        : []),

      ...prevStages,

      {
        $lookup: {
          from: 'users',
          localField: 'client_id',
          foreignField: '_id',
          as: 'clientDetails',
          pipeline: [
            // Will exclude lives without a channel logo
            { $match: { photo: { $exists: true } } },

            {
              $project: {
                fullName: { $concat: ['$first_name', ' ', '$last_name'] },
                photo: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$photo.Key'] },
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
        $set: {
          streamKey: '$stream_key',
          vidClass: '$vid_class',
          coverPhoto: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$coverPhoto.Key'] },
          previewVideoUploadDoc: { $ifNull: [{ $first: '$previewVideoUploads' }, null] },
          activeViews: '$active_views',
          featExpiry: '$feat_expiry',
          clientDetails: { $first: '$clientDetails' },
        },
      },

      {
        $set: {
          channelLogo: '$clientDetails.photo',
        },
      },

      { $unset: ['clientDetails.photo'] },

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
      prevStages: [match],

      page,
      limit,
      sortStage: { $sort: { engagements: -1 } },
    })
  }
}
