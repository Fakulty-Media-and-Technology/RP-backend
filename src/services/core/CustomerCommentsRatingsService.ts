import { CommentModel } from '../../models/comments.model'
import { RatingModel } from '../../models/rating.model'
import { ReactionModel } from '../../models/reaction.model'
import { toObjectId } from '../../repositories/VideoRepo'
import { OperationalError } from '../../utils/OperationalError'

type UpdateRatingInput = {
  ratingId: string
  comment?: string
  rate?: number
}

type AddReplyInput = {
  parentCommentId: string
  message: string
  authorId: string
  parentType: string
  parentId: string
}

type AddReaction = {
  commentId: string
  reaction: string
  authorId: string
}

export class CustomerCommentsRatingsService {
  static CUReaction = async ({ commentId, reaction, authorId }: AddReaction) => {
    await ReactionModel.findOneAndUpdate(
      {
        userId: authorId,
        commentId,
      },
      { reaction },
      { upsert: true },
    )
  }

  static deleteReaction = async (reactionId: string) => {
    await ReactionModel.findByIdAndDelete(reactionId)
  }

  static addComment = async (input: Record<string, any>) => {
    const comment = await CommentModel.create(input)
    return comment
  }

  static addReply = async ({
    parentCommentId,
    message,
    authorId,
    parentType,
    parentId,
  }: AddReplyInput) => {
    const reply = await CommentModel.create({
      userId: authorId,
      message,
      parentCommentId,
      parentId,
      parentType,
    })
  }

  static updateComment = async (commentId: string, message: string) => {
    const comment = await CommentModel.findByIdAndUpdate(commentId, { message }, { new: true })

    if (comment == null) {
      throw new OperationalError('Invalid comment ID', 400)
    }

    return comment
  }

  static deleteComment = async (commentId: string) => {
    const deletedComment = await CommentModel.findByIdAndDelete(commentId)

    if (deletedComment == null) {
      throw new OperationalError('Invalid comment ID', 400)
    }
  }

  static getComments = async (parentId: string) => {
    const comments = await CommentModel.aggregate([
      {
        $match: {
          parentId: toObjectId(parentId),
        },
      },

      {
        $group: {
          _id: null,
          totalComments: { $sum: 1 },
          comments: { $push: '$$ROOT' },
        },
      },
    ])

    return comments
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
          ratings: { $push: '$$ROOT' },
        },
      },
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
}
