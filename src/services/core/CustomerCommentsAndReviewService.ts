import { Comment, CommentModel } from '../../models/comments.model'
import { OperationalError } from '../../utils/OperationalError'

type AddCommentInput = {
  customerId: string
  message?: string
  parentType: Comment['parentType']
  parentId: Comment['parentId']
}

export class CustomerCommentsAndReviewService {
  static addComment = async (input: AddCommentInput) => {
    const comment = await CommentModel.create(input)
    return comment
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

  static getCommentsForParent = async (parentId: string) => {
    const comments = await CommentModel.find({ parentId })
    return comments
  }

  // ********* Ratings
  addRating = async () => {}
  updateRating = async () => {}
  deleteRating = async () => {}
}
