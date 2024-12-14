import { WithdrawalService } from '../../services/core/WithdrawalService'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class WithdrawalController {
  static reqPayout = Catch.async(async (req, res) => {
    await WithdrawalService.requestPayout(GetDefined.loggedInUser(req.user), req.body)

    sendResponse({
      res,
      message: 'payout request submitted',
    })
  })

  static reqPayoutEdit = Catch.async(async ({ user, params, body }, res) => {
    await WithdrawalService.editPayout(GetDefined.loggedInUser(user), params.id, body)

    sendResponse({
      res,
      message: 'Payout edited',
    })
  })

  static payoutReqInfoAll = Catch.async(async ({ user }, res) => {
    sendResponse({
      res,
      message: 'payout requests all history',
      data: await WithdrawalService.requestAllPayoutInfo(GetDefined.loggedInUser(user)),
    })
  })

  static payoutReqInfoGroup = Catch.async(async ({ user }, res) => {
    sendResponse({
      res,
      message: 'payout requests all grouped',
      data: await WithdrawalService.requestPayoutInfoGroups(GetDefined.loggedInUser(user)),
    })
  })
}
