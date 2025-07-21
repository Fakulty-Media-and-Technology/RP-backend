import { Aggregate, PipelineStage } from 'mongoose'
import { CommentModel } from '../models/comments.model'
import { MongoDBObjectId } from '../types/general'

type PageOptions = {
  skip: number
  limit: number
}

type GetCommentsAggeResInput = PageOptions & {
  match: PipelineStage.Match
  userId: MongoDBObjectId
}

type GetCommentsInput = PageOptions & {
  parentId: string
  userId: MongoDBObjectId
}

type GetRepliesInput = Omit<GetCommentsInput, 'parentId'> & {
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

export type GetRepliesResponse = GetCommentsResponse & {
  _id: string
  parentCommentAuthor: Author
}

export type Author = {
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

  static getCommentById = (commentId: string, userId: MongoDBObjectId) => {
    return this._getCommentsRes({
      skip: 0,
      limit: 1,
      userId,
      match: {
        $match: { $expr: { $eq: ['$_id', { $toObjectId: commentId }] } },
      },
    })
  }

  static getReplyById = (commentId: string, userId: MongoDBObjectId) => {
    return this._getRepliesRes({
      skip: 0,
      limit: 1,
      userId,
      match: {
        $match: { $expr: { $eq: ['$_id', { $toObjectId: commentId }] } },
      },
    })
  }

  static getComments = ({ parentId, skip, limit, userId }: GetCommentsInput) => {
    return this._getCommentsRes({
      skip,
      limit,
      userId,
      match: {
        $match: { $expr: { $eq: ['$parentId', { $toObjectId: parentId }] } },
      },
    })
  }

  static getReplies = ({ parentCommentId, skip, limit, userId }: GetRepliesInput) => {
    return this._getRepliesRes({
      skip,
      limit,
      userId,
      match: {
        $match: { $expr: { $eq: ['$parentCommentId', { $toObjectId: parentCommentId }] } },
      },
    })
  }

  static _getRepliesRes = ({ match, skip, limit, userId }: GetCommentsAggeResInput) => {
    const res = CommentModel.aggregate([
      { $match: { ...match.$match, parentCommentId: { $exists: true } } },

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
          originalParentCommentId: '$parentCommentId',

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
        $lookup: {
          from: 'comments',
          localField: 'parentCommentId',
          foreignField: '_id',
          as: 'parentComment',

          pipeline: [
            {
              $lookup: {
                from: 'users',
                foreignField: '_id',
                localField: 'userId',
                as: 'parentCommentUser',

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

            { $match: { 'parentCommentUser.0': { $exists: true } } },

            {
              $set: {
                user: { $first: '$parentCommentUser' },
              },
            },
          ],
        },
      },

      { $match: { 'parentComment.0': { $exists: true } } },

      {
        $lookup: {
          from: 'reactions',
          localField: '_id',
          foreignField: 'commentId',
          as: 'reactions',

          pipeline: [
            {
              $project: {
                isUserReaction: { $toBool: { $eq: ['$userId', userId] } },
              },
            },
          ],
        },
      },

      {
        $set: {
          userReaction: {
            $first: {
              $filter: {
                input: '$reactions',
                cond: { $eq: ['$$this.isUserReaction', true] },
                limit: 1,
              },
            },
          },
        },
      },

      {
        $project: {
          author: { $first: '$user' },
          parentCommentAuthor: { $first: '$parentComment.user' },
          totalReactions: { $size: '$reactions' },
          parentCommentId: '$originalParentCommentId',
          reactionId: {
            $ifNull: ['$userReaction._id', null],
          },

          content: '$message',
          createdAt: true,
          updatedAt: true,
        },
      },

      // { $set: { totalEngagements: { $sum: ['$totalReactions', '$totalReplies'] } } },

      // { $sort: { _id: 1, totalEngagements: -1 } },
      { $sort: { _id: 1 } },
      { $skip: skip },
      { $limit: limit },
    ])

    return res as Aggregate<GetRepliesResponse[]>
  }

  static _getCommentsRes = ({ match, skip, limit, userId }: GetCommentsAggeResInput) => {
    const res = CommentModel.aggregate([
      { $match: { ...match.$match, parentCommentId: { $exists: false } } },

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
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'parentCommentId',
          as: 'replies',
          pipeline: [{ $project: { _id: true } }],
        },
      },

      {
        $lookup: {
          from: 'reactions',
          localField: '_id',
          foreignField: 'commentId',
          as: 'reactions',

          pipeline: [
            {
              $project: {
                isUserReaction: { $toBool: { $eq: ['$userId', userId] } },
              },
            },
          ],
        },
      },

      {
        $set: {
          userReaction: {
            $first: {
              $filter: {
                input: '$reactions',
                cond: { $eq: ['$$this.isUserReaction', true] },
                limit: 1,
              },
            },
          },
        },
      },

      {
        $project: {
          author: { $first: '$user' },

          reactionId: {
            $ifNull: ['$userReaction._id', null],
          },

          totalReactions: { $size: '$reactions' },
          totalReplies: { $size: '$replies' },
          content: '$message',
          createdAt: true,
          updatedAt: true,
        },
      },

      // { $set: { totalEngagements: { $sum: ['$totalReactions', '$totalReplies'] } } },

      // { $sort: { totalEngagements: -1, _id: 1 } },
      { $sort: { _id: 1 } },
      { $skip: skip },
      { $limit: limit },
    ])

    return res as Aggregate<GetCommentsResponse[]>
  }
}
