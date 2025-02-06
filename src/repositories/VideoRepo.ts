import { FilterQuery } from 'mongoose'
import { Video, VideoModel } from '../models/videos.model'
import { AllVideoTypes } from '../services/core/AdminUploadService'
import { skip } from '../utils/QueryParamsFeatures'

export class VideoRepo {
  static findByType = (type: string) => VideoModel.find({ type })

  static totalVideosCountQuery = (filter: FilterQuery<Video> = {}) =>
    VideoModel.find(filter).countDocuments()

  static totalMovieSeriesCountQuery = () =>
    this.totalVideosCountQuery({ type: { $in: ['movie', 'series'] } })

  static totalMusicVideosCountQuery = () => this.totalVideosCountQuery({ type: 'music-video' })

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

  static fetchByType = async (type: AllVideoTypes, page: number, limit: number) => {
    const aggr = await VideoModel.aggregate([
      {
        $match: { type },
      },
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
          pipeline: [{ $match: { isTranscoded: true } }],
        },
      },
      {
        $lookup: {
          from: 'sub_titles',
          localField: '_id',
          foreignField: 'video_id',
          as: 'subtitle',
          pipeline: [{ $project: { key: true, bucket: true } }],
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
                pipeline: [{ $match: { isTranscoded: true } }],
              },
            },

            { $addFields: { trailerVideoUpload: { $first: '$trailerVideoUpload' } } },
          ],
        },
      },
      {
        $addFields: {
          trailerVideoUpload: { $first: '$trailer.trailerVideoUpload._id' },
          videoUpload: { $first: '$videoUpload._id' },
          portraitPhoto: { $first: '$portraitPhoto' },
          landscapePhoto: { $first: '$landscapePhoto' },
          subtitle: { $first: '$subtitle' },
        },
      },
      {
        $project: {
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
      { $sort: { createdAt: 1 } },
      { $skip: skip(page, limit) },
      { $limit: limit },
    ])

    return aggr
  }

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
