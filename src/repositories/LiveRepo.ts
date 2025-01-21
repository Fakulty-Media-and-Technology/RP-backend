import { FilterQuery } from 'mongoose'
import { LiveModel, LiveSchema } from '../models/lives.model'

export class LiveRepo {
  static getByStreamKey = async (streamKey: string) => LiveModel.findOne({ stream_key: streamKey })

  static getChannels = () => LiveModel.find({ type: 'channel' })

  static totalActiveLiveQuery = () => LiveModel.find({ active: true })

  static searchLivesByTextReg = (textReg: RegExp) => {
    return LiveModel.find({
      $or: [
        { title: { $regex: textReg } },
        { sub_title: { $regex: textReg } },
        { description: { $regex: textReg } },
      ],
    })
  }

  static getFeatured = () => {
    return LiveModel.find({
      featured: true,
      expired: false,
    })
  }

  static addFeatured = (id: string, expiry: string) => {
    return LiveModel.findByIdAndUpdate(id, {
      featured: true,
      feat_expiry: new Date(expiry),
    })
  }

  static getActiveById = (id: string) => {
    return LiveModel.findOne({ _id: id, active: true })
  }

  static getSelectedLive = (filter: FilterQuery<LiveSchema>) => {
    return LiveModel.find(filter).select(
      '-__v -client_id -createdAt -updatedAt -sponsored -popular -likes -stream_key',
    )
  }

  static getMostEngaged = () => {
    return LiveModel.aggregate([
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
    ])
  }
}
