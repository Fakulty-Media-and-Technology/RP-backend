import { QueryOptions, UpdateQuery } from 'mongoose'
import { Comment, CommentModel } from '../../models/comments.model'
import { Rating, RatingModel } from '../../models/rating.model'
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
import { RatingsRepo } from '../../repositories/ReatingsRepo'

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

type GetCommentById = {
  currentUserId: MongoDBObjectId
  commentId: string
  type: string
}

type GetRepliesInput = Omit<GetCommentsInput, 'parentId'> & {
  commentId: string
}

type CreateRating = {
  rate: number
  parentType: string
  parentId: string
  comment?: string
  userId: string
}

export class SocialService {
  static CUReaction = async ({ commentId, reaction, authorId }: AddReaction) => {
    const reactionDocument = await ReactionModel.findOneAndUpdate(
      {
        userId: authorId,
        commentId,
      },
      { reaction },
      { upsert: true, new: true },
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
        const videoDocument = await VideoModel.findByIdAndUpdate(parentId, update, options)

        if (videoDocument) {
          videoDocument.computeEngagements()
        }

        parent = videoDocument

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

    return comment
  }

  static addComment = async (input: AddCommentInput) =>
    await withMongoDBSession(this._addCommentTransaction, input)

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

    return reply
  }

  static addReply = async (input: AddReplyInput) =>
    await withMongoDBSession(this._addReplyTransaction, input)

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

  static getComments = async ({ query, parentId, currentUserId }: GetCommentsInput) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const comments = await CommentsRepo.getComments({
      parentId,
      userId: currentUserId,
      skip,
      limit,
    })

    return comments
  }

  static getReplies = async ({ commentId, query, currentUserId }: GetRepliesInput) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const replies = await CommentsRepo.getReplies({
      parentCommentId: commentId,
      userId: currentUserId,
      skip,
      limit,
    })

    return replies
  }

  protected static _computeRatingsParentStats = async (ratingsDocument: Rating | null) => {
    try {
      if (ratingsDocument == null) return

      switch (ratingsDocument.parentType) {
        case 'vod':
          const videoDocument = await VideoModel.findById(ratingsDocument.parentId)

          if (videoDocument == null) return

          const [stats] = await RatingsRepo.parentRatingsStats(videoDocument._id.toString())

          videoDocument.averageRating =
            stats?.totalStats[0]?.averageRating || videoDocument.averageRating

          videoDocument.totalRatings =
            stats?.totalStats[0]?.totalRatingsDocuments || videoDocument.totalRatings
          videoDocument.computeEngagements()
          break

        default:
          break
      }
    } catch (e) {
      console.error('Error computing ratings parents stats', ratingsDocument, 'Reason', e)
    }
  }

  // ********* Ratings
  static addRating = async ({ userId, rate, parentId, parentType, comment }: CreateRating) => {
    const ratingsDocument = await RatingModel.findOneAndUpdate(
      {
        userId,
        parentId,
      },
      { parentType, comment, rate },
      { new: true, upsert: true },
    )

    this._computeRatingsParentStats(ratingsDocument)

    return ratingsDocument
  }

  static getRatings = async (parentId: string) => {
    const [ratings] = await RatingsRepo.parentRatingsStats(parentId)
    return ratings
  }

  static updateRating = async ({ ratingId, comment, rate }: UpdateRatingInput) => {
    const ratingsDocument = await RatingModel.findById(ratingId)

    if (ratingsDocument === null) {
      throw new OperationalError('invalid rating Id', 404)
    }

    ratingsDocument.comment = comment ? comment : ratingsDocument.comment
    ratingsDocument.rate = rate ? rate : ratingsDocument.rate
    await ratingsDocument.save()
    this._computeRatingsParentStats(ratingsDocument)
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
