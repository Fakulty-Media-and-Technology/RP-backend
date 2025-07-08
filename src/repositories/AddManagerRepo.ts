import { Aggregate, PipelineStage } from 'mongoose'
import { AdModel, AdSchema } from '../models/admanager.model'
import { VideoUploadSchema } from '../models/videoupload.model'

interface FetchManyInput {
  skip: number
  limit: number
  type: unknown
}

interface FetchAdResult extends Omit<AdSchema, 'videoUpload'> {
  videoUpload: VideoUploadSchema
}

export class AdManagerRepo {
  protected static _typeMatch = (type: unknown): PipelineStage.Match => {
    const match: PipelineStage.Match = { $match: {} }

    if (typeof type !== 'string' || type === 'all') {
      return match
    }

    match.$match.type = type
    return match
  }

  protected static _pipeline = [
    {
      $lookup: {
        from: 'video_uploads',
        localField: 'videoUpload',
        foreignField: '_id',
        as: 'videoUpload',
        pipeline: [{ $match: { isTranscoded: true } }],
      },
    },
    { $match: { 'videoUpload.0': { $exists: true } } },
    { $set: { videoUpload: { $first: '$videoUpload' } } },
  ]

  static fetchMany = ({ skip, limit, type }: FetchManyInput) => {
    const res = AdModel.aggregate([
      this._typeMatch(type),
      ...this._pipeline,
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },
    ])

    return res as Aggregate<FetchAdResult[]>
  }

  static fetcRandom = (type: unknown) => {
    const res = AdModel.aggregate([
      this._typeMatch(type),
      ...this._pipeline,
      { $sample: { size: 1 } },
    ])

    return res as Aggregate<FetchAdResult[]>
  }
}
