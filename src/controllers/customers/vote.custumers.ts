import { VoteService } from '../../services/core/VoteService'
import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'

export class CustomerVoteController {
  static fetchVoteInfo = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      data: await VoteService.fetchVoteInfoByLiveId(query.live_id as string, query),
    })
  })

  static fetchVoteContestants = Catch.async(async ({ query: { live_id } }, res) => {
    if (typeof live_id !== 'string') {
      throw new OperationalError('required query.live_id must be a string', 400)
    }

    sendResponse({
      res,
      data: await VoteService.fetchVoteContestants(live_id),
    })
  })
}
