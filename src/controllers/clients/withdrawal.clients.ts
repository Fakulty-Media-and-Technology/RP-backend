import { PayoutService } from '../../services/core/PayoutService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class ClientWithdrawalController {
  static reqPayout = Catch.async(async (req, res) => {
    await PayoutService.requestPayout({
      ...req.body,
      currentUser: GetDefined.loggedInUser(req.user),
    })

    sendResponse({
      res,
      message: 'payout request submitted',
    })
  })

  static payoutReqInfoAll = Catch.async(async ({ user, query }, res) => {
    sendResponse({
      res,
      message: 'payout requests all history',
      data: await PayoutService.requestAllPayoutInfo(GetDefined.loggedInUser(user), query),
    })
  })

  static payoutReqInfoGroup = Catch.async(async ({ user }, res) => {
    sendResponse({
      res,
      message: 'payout requests all grouped',
      data: await PayoutService.requestPayoutInfoGroups(GetDefined.loggedInUser(user)),
    })
  })
}
