import { Aggregate, PipelineStage } from 'mongoose'
import { CommentModel } from '../models/comments.model'
import { MongoDBObjectId } from '../types/general'

type PageOptions = {
  skip: number
  limit: number
}

type GetCommentsAggeResInput = PageOptions & {
  match: PipelineStage.Match
}

type GetCommentsInput = PageOptions & {
  parentId: string
}

type GetRepliesInput = PageOptions & {
  parentCommentId: string
}

export type GetCommentsResponse = {
  _id: string
  createdAt: string
  updatedAt: string
  commentId: string
  author: Author
  totalReactions: number
  totalReplies: number
  content: string
  totalEngagements: number
}

type Author = {
  fullName: string
  photoKey: null | string
  photoBucket: null | string
  userDocumentId: string
}

export class CommentsRepo {
  static fetchTotalRepliesCountByCommentId = (commentId: string) => {
    const res = CommentModel.aggregate([
      {
        $match: {
          $expr: { $eq: ['$_id', { $toObjectId: commentId }] },
        },
      },

      { $project: { _id: true } },

      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'parentCommentId',
          as: 'replies',
          pipeline: [{ $project: { _id: true } }],
        },
      },

      {
        $project: {
          totalReplies: { $size: '$replies' },
        },
      },
    ])

    return res as Aggregate<({ totalReplies: number; _id: MongoDBObjectId } | undefined)[]>
  }

  static getComments = ({ parentId, skip, limit }: GetCommentsInput) => {
    return this._getCommentsRes({
      skip,
      limit,
      match: {
        $match: { $expr: { $eq: ['$parentId', { $toObjectId: parentId }] } },
      },
    })
  }

  static getReplies = ({ parentCommentId, skip, limit }: GetRepliesInput) => {
    return this._getCommentsRes({
      skip,
      limit,
      match: {
        $match: { $expr: { $eq: ['$parentCommentId', { $toObjectId: parentCommentId }] } },
      },
    })
  }

  static _getCommentsRes = ({ match, skip, limit }: GetCommentsAggeResInput) => {
    const res = CommentModel.aggregate([
      match,

      {
        $lookup: {
          from: 'reactions',
          localField: '_id',
          foreignField: 'commentId',
          as: 'reactions',
        },
      },

      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'parentCommentId',

          let: {
            parentCommentId: '$parentCommentId',
            parentReplyId: '$parentReplyId',
          },

          as: 'replies',
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$parentCommentId', '$$parentCommentId'] },
                    { $eq: ['$parentReplyId', '$$parentReplyId'] },
                  ],
                },
              },
            },
            { $project: { _id: true } },
          ],
        },
      },

      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',

          pipeline: [
            {
              $project: {
                fullName: { $concat: ['$first_name', ' ', '$last_name'] },
                photoKey: { $ifNull: ['$photo.Key', null] },
                photoBucket: { $ifNull: ['$photo.Bucket', null] },
                userDocumentId: '$_id',
                _id: '$$REMOVE',
              },
            },
          ],
        },
      },

      { $match: { 'user.0': { $exists: true } } },

      {
        $set: {
          parentCommentId: {
            $cond: {
              if: { $eq: [{ $ifNull: ['$parentReplyId', null] }, null] },
              then: '$parentCommentId',
              else: '$parentReplyId',
            },
          },
        },
      },

      {
        $project: {
          commentId: '$_id',
          author: { $first: '$user' },
          totalReactions: { $size: '$reactions' },
          totalReplies: { $size: '$replies' },
          content: '$message',
          reactions: '$$REMOVE',
          createdAt: true,
          updatedAt: true,
        },
      },

      { $set: { totalEngagements: { $sum: ['$totalReactions', '$totalReplies'] } } },

      { $sort: { totalEngagements: -1, _id: 1 } },
      { $skip: skip },
      { $limit: limit },
    ])

    return res as Aggregate<GetCommentsResponse[]>
  }
}
