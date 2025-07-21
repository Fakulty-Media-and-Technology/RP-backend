import { SocialService } from '../../services/core/SocialService'
import { Catch } from '../../utils/Catch'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class SocialsController {
  static deleteReaction = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    await SocialService.deleteReaction(req.params.reactionId)

    sendResponse({
      res,
      message: 'reaction deleted successfully',
    })
  })

  static createUpdateReaction = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const response = await SocialService.CUReaction({
      commentId: req.params.commentId,
      reaction: req.params.reaction,
      authorId: user.id,
    })

    sendResponse({
      res,
      message: 'reaction created successfully',
      data: response,
    })
  })

  static addComment = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    await SocialService.addComment({
      ...req.body,
      authorId: user.id,
    })

    sendResponse({
      res,
      message: 'comment created successfully',
    })
  })

  static addReply = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    await SocialService.addReply({
      ...req.body,
      authorId: user._id.toString(),
    })

    sendResponse({
      res,
      message: 'reply created successfully',
    })
  })

  static getTotalCommentsCount = Catch.async(async (req, res) => {
    const result = await SocialService.totalCommentsCount(req.params.parentId)

    sendResponse({
      res,
      data: result,
      message: '',
    })
  })

  static getComments = Catch.async(async (req, res) => {
    const comments = await SocialService.getComments({
      parentId: req.params.parentId,
      query: req.query,
      currentUserId: GetDefined.loggedInUser(req.user)._id,
    })

    sendResponse({
      res,
      data: comments,
      message: 'comments fetched successfully',
    })
  })

  static getReplies = Catch.async(async (req, res) => {
    const replies = await SocialService.getReplies({
      commentId: req.params.commentId,
      query: req.query,
      currentUserId: GetDefined.loggedInUser(req.user)._id,
    })

    sendResponse({
      res,
      data: replies,
      message: 'replies fetched successfully',
    })
  })

  static updateComment = Catch.async(async (req, res) => {
    denyGuestUser(GetDefined.loggedInUser(req.user))
    const comment = await SocialService.updateComment(req.params.commentId, req.body.message)

    sendResponse({
      res,
      data: comment,
      message: 'comment updated successfully',
    })
  })

  static deleteComment = Catch.async(async (req, res) => {
    denyGuestUser(GetDefined.loggedInUser(req.user))
    await SocialService.deleteComment(req.params.commentId)

    sendResponse({
      res,
      message: 'comment deleted successfully',
    })
  })

  static addRating = Catch.async(async (req, res) => {
    const user = GetDefined.loggedInUser(req.user)
    denyGuestUser(user)

    const rating = await SocialService.addRating({
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
      data: await SocialService.getRatings(req.params.parentId),
    })
  })

  static updateRating = Catch.async(async (req, res) => {
    const rating = await SocialService.updateRating({
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
    await SocialService.deleteRating(req.params.ratingId)

    sendResponse({
      res,
      message: 'rating deleted successfully',
    })
  })
}
