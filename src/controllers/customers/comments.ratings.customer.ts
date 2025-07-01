import { CustomerCommentsRatingsService } from '../../services/core/CustomerCommentsRatingsService'
import { Catch } from '../../utils/Catch'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class CustomerCommentsRatingsController {
  static deleteReaction = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    await CustomerCommentsRatingsService.deleteReaction(req.params.reactionId)

    sendResponse({
      res,
      message: 'reaction deleted successfully',
    })
  })

  static createUpdateReaction = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    await CustomerCommentsRatingsService.CUReaction({
      commentId: req.params.commentId,
      reaction: req.params.reaction,
      authorId: user.id,
    })

    sendResponse({
      res,
      message: 'reaction created successfully',
    })
  })

  static addComment = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    await CustomerCommentsRatingsService.addComment({
      ...req.body,
      userId: user.id,
    })

    sendResponse({
      res,
      message: 'comment created successfully',
    })
  })

  static addReply = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    await CustomerCommentsRatingsService.addReply({
      ...req.body,
      authorId: user._id.toString(),
    })

    sendResponse({
      res,
      message: 'reply created successfully',
    })
  })

  static getComments = Catch.async(async (req, res) => {
    const comments = await CustomerCommentsRatingsService.getComments(req.params.parentId)

    sendResponse({
      res,
      data: comments,
      message: 'comments fetched successfully',
    })
  })

  static updateComment = Catch.async(async (req, res) => {
    denyGuestUser(GetDefined.loggedInUser(req.user))
    const comment = await CustomerCommentsRatingsService.updateComment(
      req.params.commentId,
      req.body.message,
    )

    sendResponse({
      res,
      data: comment,
      message: 'comment updated successfully',
    })
  })

  static deleteComment = Catch.async(async (req, res) => {
    denyGuestUser(GetDefined.loggedInUser(req.user))
    await CustomerCommentsRatingsService.deleteComment(req.params.commentId)

    sendResponse({
      res,
      message: 'comment deleted successfully',
    })
  })

  static addRating = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const rating = await CustomerCommentsRatingsService.addRating({
      ...req.body,
      userId: user.id,
    })

    sendResponse({
      res,
      message: 'rating created successfully',
      data: rating,
    })
  })

  static getRatings = Catch.async(async (req, res) => {
    sendResponse({
      res,
      message: 'rating fetched successfully',
      data: await CustomerCommentsRatingsService.getRatings(req.params.parentId),
    })
  })

  static updateRating = Catch.async(async (req, res) => {
    const rating = await CustomerCommentsRatingsService.updateRating({
      ...req.body,
      ratingId: req.params.ratingId,
    })

    sendResponse({
      res,
      message: 'rating updated successfully',
      data: rating,
    })
  })

  static deleteRating = Catch.async(async (req, res) => {
    await CustomerCommentsRatingsService.deleteRating(req.params.ratingId)

    sendResponse({
      res,
      message: 'rating deleted successfully',
    })
  })
}
