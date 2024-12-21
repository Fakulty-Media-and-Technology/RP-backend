import { CustomerVoteService } from '../../services/core/CustomerVoteService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'

export class CustomerVoteController {
  static fetchVoteInfo = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      data: await CustomerVoteService.fetchVoteInfoByLiveId(query.live_id),
    })
  })

  static fetchVoteContestants = Catch.async(async ({ query: { live_id } }, res) => {
    if (typeof live_id !== 'string') {
      throw new OperationalError('required query.live_id must be a string', 400)
    }

    sendResponse({
      res,
      data: await CustomerVoteService.fetchVoteContestantsByLiveId(live_id),
    })
  })

  static createVote = Catch.async(async ({ user, body }, res) => {
    await CustomerVoteService.createVote(GetDefined.loggedInUser(user), body)

    sendResponse({
      res,
      message: 'vote created',
    })
  })

  static donateFund = Catch.async(async ({ user, body }, res) => {
    await CustomerVoteService.donateFund(GetDefined.loggedInUser(user), body)

    sendResponse({
      res,
      message: 'fund donated',
    })
  })
}
