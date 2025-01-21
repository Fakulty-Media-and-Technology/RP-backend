import { FilterQuery } from 'mongoose'
import { Video, VideoModel } from '../models/videos.model'

export class VideoRepo {
  static findByType = (type: string) => VideoModel.find({ type })

  static totalVideosCountQuery = (filter: FilterQuery<Video> = {}) =>
    VideoModel.find(filter).countDocuments()

  static totalMovieSeriesCountQuery = () =>
    this.totalVideosCountQuery({ type: { $in: ['movie', 'series'] } })

  static totalMusicVideosCountQuery = () => this.totalVideosCountQuery({ type: 'music video' })

  static totalSkitVideosCOuntQuery = () => this.totalVideosCountQuery({ type: 'skit' })

  static searchTitleOrDescriptionByTextReg = (textReg: RegExp) =>
    VideoModel.find({
      $or: [{ title: { $regex: textReg } }, { description: { $regex: textReg } }],
    })

  static getFeatured = () => VideoModel.find({ featured: true })

  static addFeatured = (id: string, expiry: string) =>
    VideoModel.findByIdAndUpdate(id, {
      featured: true,
      feat_expiry: new Date(expiry),
    })

  static getMostEngaged = async () => {
    return VideoModel.aggregate([
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
      { $limit: 10 },
      { $project: { ratings: false, comments: false, __v: false } },
    ])
  }
}

