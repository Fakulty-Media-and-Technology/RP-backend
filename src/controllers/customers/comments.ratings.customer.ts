import { CustomerCommentsRatingsService } from '../../services/core/CustomerCommentsRatingsService'
import { Catch } from '../../utils/Catch'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class CustomerCommentsRatingsController {
  static addComment = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const comment = await CustomerCommentsRatingsService.addComment({
      ...req.body,
      userId: user.id,
    })

    sendResponse({
      res,
      data: comment,
      message: 'comment created successfully',
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
