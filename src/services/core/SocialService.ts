import { QueryOptions, UpdateQuery } from 'mongoose'
import { Comment, CommentModel } from '../../models/comments.model'
import { RatingModel } from '../../models/rating.model'
import { ReactionModel } from '../../models/reaction.model'
import { toObjectId } from '../../repositories/VideoRepo'
import { OperationalError } from '../../utils/OperationalError'
import { VideoModel } from '../../models/videos.model'
import { EpisodeModel } from '../../models/episodes.model'
import { LiveModel } from '../../models/lives.model'
import { SeasonModel } from '../../models/seasons.model'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { commentsParent } from '../../models/assets'
import {
  Author,
  CommentsRepo,
  GetCommentsResponse,
  GetRepliesResponse,
} from '../../repositories/CommentsRepo'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { MediaAccess } from '../media-access'
import { getPromiseAllFulfilledResults } from '../../utils/promises'
import { MongoDBObjectId } from '../../types/general'

type UpdateRatingInput = {
  ratingId: string
  comment?: string
  rate?: number
}

type AddCommentInput = {
  message: string
  authorId: string
  parentType: string
  parentId: string
}

type AddReplyInput = { parentCommentId: string; parentReplyId?: string } & AddCommentInput

type AddReaction = {
  commentId: string
  reaction: string
  authorId: string
}

type IncCommentsCountInput = {
  comment: Comment
  session: MaybeSession
  action: 'CREATE' | 'DELETE'
  incCount: number
}

type GetCommentsInput = {
  parentId: string
  query: ExpressRequestQuery
  currentUserId: MongoDBObjectId
}

type GetRepliesInput = Omit<GetCommentsInput, 'parentId'> & {
  commentId: string
}

export class SocialService {
  static CUReaction = async ({ commentId, reaction, authorId }: AddReaction) => {
    const reactionDocument = await ReactionModel.findOneAndUpdate(
      {
        userId: authorId,
        commentId,
      },
      { reaction },
      { upsert: true },
    )

    if (reactionDocument == null) {
      throw new OperationalError('could not create reaction', 500)
    }

    return { reactionId: reactionDocument._id }
  }

  static deleteReaction = async (reactionId: string) => {
    await ReactionModel.findByIdAndDelete(reactionId)
  }

  protected static _incParentCommentsCount = async ({
    comment,
    session,
    action,
    incCount,
  }: IncCommentsCountInput) => {
    const parentId = comment.parentId
    const isCreateAction = action === 'CREATE'
    const options: QueryOptions = { session }
    const update: UpdateQuery<any> = {
      $inc: { commentsCount: incCount },
    }

    let parent: any = null

    switch (comment.parentType) {
      case 'vod':
        parent = await VideoModel.findByIdAndUpdate(parentId, update, options)
        break

      case 'episode':
        parent = await EpisodeModel.findByIdAndUpdate(parentId, update, options)
        break

      case 'live':
        parent = await LiveModel.findByIdAndUpdate(parentId, update, options)
        break

      case 'season':
        parent = await SeasonModel.findByIdAndUpdate(parentId, update, options)
        break
      default:
        if (isCreateAction) {
          throw new OperationalError(`Allowed parents type are ${commentsParent.join(' - ')}`, 400)
        }
        break
    }

    if (isCreateAction && parent == null) {
      throw new OperationalError('invalid parentId or parentType pair', 404)
    }
  }

  protected static _addCommentTransaction = async (
    { message, parentId, parentType, authorId }: AddCommentInput,
    session: MaybeSession,
  ) => {
    const comment = await new CommentModel({
      userId: authorId,
      message,
      parentType,
      parentId,
    }).save({ session })

    await this._incParentCommentsCount({
      comment,
      session,
      action: 'CREATE',
      incCount: 1,
    })
  }

  static addComment = async (input: AddCommentInput) => {
    await withMongoDBSession(this._addCommentTransaction, input)
  }

  static _addReplyTransaction = async (
    { parentCommentId, message, authorId, parentType, parentId, parentReplyId }: AddReplyInput,
    session: MaybeSession,
  ) => {
    const reply = await new CommentModel({
      userId: authorId,
      message,
      parentCommentId,
      parentReplyId,
      parentId,
      parentType,
    }).save({ session })

    await this._incParentCommentsCount({
      comment: reply,
      session,
      action: 'CREATE',
      incCount: 1,
    })
  }

  static addReply = async (input: AddReplyInput) => {
    await withMongoDBSession(this._addReplyTransaction, input)
  }

  static updateComment = async (commentId: string, message: string) => {
    const comment = await CommentModel.findByIdAndUpdate(commentId, { message }, { new: true })

    if (comment == null) {
      throw new OperationalError('Invalid comment ID', 400)
    }

    return comment
  }

  protected static _deleteCommentTransaction = async (commentId: string, session: MaybeSession) => {
    const [totalRepliesResult, deleteCommentResult] = await Promise.allSettled([
      CommentsRepo.fetchTotalRepliesCountByCommentId(commentId),
      CommentModel.findByIdAndDelete(commentId, { session }),
    ])

    if (totalRepliesResult.status === 'rejected') {
      throw totalRepliesResult.reason
    }

    if (deleteCommentResult.status === 'rejected') {
      throw deleteCommentResult.reason
    }

    const deletedComment = deleteCommentResult.value
    const [repliesCount] = totalRepliesResult.value

    if (deletedComment === null) {
      throw new OperationalError('Invalid comment ID', 400)
    }

    // delete replies
    await CommentModel.deleteMany({ parentCommentId: deletedComment._id }, { session })

    const totalReplies = repliesCount?.totalReplies || 0
    const totalDeletedComments = totalReplies + 1

    await this._incParentCommentsCount({
      comment: deletedComment,
      session,
      action: 'DELETE',
      incCount: -Number(totalDeletedComments),
    })
  }

  static deleteComment = async (commentId: string) => {
    await withMongoDBSession(this._deleteCommentTransaction, commentId)
  }

  protected static _attachAuthorPhoto = async (
    comments: (GetRepliesResponse | GetCommentsResponse)[],
  ) => {
    const fetchAuthorPhotoUrl = async (author?: Author) => {
      if (author == null) return

      const bucket = author.photoBucket
      const key = author.photoKey

      if (bucket && key) {
        return await MediaAccess.getSignedUrl(bucket, key, 'photo')
      }
    }

    const withAuthorPhotosResults = await Promise.allSettled(
      comments.map(async comment => {
        const [authorPhotoURL, parentCommentAuthorPhotoURL] = await Promise.all([
          fetchAuthorPhotoUrl(comment.author),

          // @ts-ignore
          fetchAuthorPhotoUrl(comment.parentCommentAuthor as any),
        ])

        return {
          ...comment,
          authorPhotoURL,
          parentCommentAuthorPhotoURL,
        }
      }),
    )

    return getPromiseAllFulfilledResults(withAuthorPhotosResults)
  }

  static getCommentById = (commentId: string, type: 'COMMENT' | 'REPLY') => {}

  static getComments = async ({ query, parentId, currentUserId }: GetCommentsInput) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const comments = await CommentsRepo.getComments({
      parentId,
      userId: currentUserId,
      skip,
      limit,
    })

    return await this._attachAuthorPhoto(comments)
  }

  static getReplies = async ({ commentId, query, currentUserId }: GetRepliesInput) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const replies = await CommentsRepo.getReplies({
      parentCommentId: commentId,
      userId: currentUserId,
      skip,
      limit,
    })

    return await this._attachAuthorPhoto(replies)
  }

  // ********* Ratings
  static addRating = async (data: Record<string, any>) => {
    const rating = await RatingModel.create(data)
    return rating
  }

  static getRatings = async (parentId: string) => {
    const ratings = await RatingModel.aggregate([
      {
        $match: {
          parentId: toObjectId(parentId),
        },
      },

      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRatings: { $avg: '$rate' },
        },
      },

      { $set: { _id: '$$REMOVE' } },
    ])

    return ratings
  }

  static updateRating = async ({ ratingId, comment, rate }: UpdateRatingInput) => {
    const rating = await RatingModel.findById(ratingId)

    if (rating === null) {
      throw new OperationalError('invalid rating Id', 404)
    }

    rating.comment = comment ? comment : rating.comment
    rating.rate = rate ? rate : rating.rate
    await rating.save()
  }

  static deleteRating = async (ratingId: string) => {
    const deletedRating = await RatingModel.findByIdAndDelete(ratingId)

    if (deletedRating === null) {
      throw new OperationalError('invalid rating Id', 404)
    }
  }

  static totalCommentsCount = async (vodId: string) => {
    const totalComments = await CommentModel.find({ parentId: vodId }).countDocuments()

    return { totalComments }
  }
}
