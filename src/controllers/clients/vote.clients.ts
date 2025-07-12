import { VoteService } from '../../services/core/VoteService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'

export class ClientVoteController {
  static createVoteInfo = Catch.async(async ({ user, body }, res) => {
    await VoteService.createVoteInfo({
      currentUser: GetDefined.loggedInUser(user),
      ...body,
    })

    sendResponse({
      res,
      message: 'vote-info instance created',
    })
  })

  static updateVoteInfo = Catch.async(async ({ user, body }, res) => {
    await VoteService.updateVoteInfo({ currentUser: GetDefined.loggedInUser(user), ...body })

    sendResponse({
      res,
      message: 'vote-info updated',
    })
  })

  static addVoteContestant = Catch.async(async ({ user, body, file }, res) => {
    if (file == null) {
      throw new OperationalError('photo file is required', 400)
    }

    await VoteService.addVoteContestant(GetDefined.loggedInUser(user), {
      ...body,
      photoFile: file,
    })

    sendResponse({
      res,
      message: 'vote contestant added',
    })
  })

  static votestatusInfo = Catch.async(async ({ user, query: { live_id } }, res) => {
    sendResponse({
      res,
      message: 'voting progress info',
      data: await VoteService.voteStatusInfo(GetDefined.loggedInUser(user), live_id as string),
    })
  })

  static rmVoteContestants = Catch.async(async ({ user, query }, res) => {
    await VoteService.removeVoteContestant(GetDefined.loggedInUser(user), {
      contestantId: query.contestant_id as string,
      liveId: query.live_id as string,
    })

    sendResponse({
      res,
      statusCode: 204,
    })
  })

  static fetchVoteContestants = Catch.async(async ({ query: { live_id } }, res) => {
    sendResponse({
      res,
      message: 'vote contestants',
      data: await VoteService.fetchVoteContestants(live_id as string),
    })
  })
}
