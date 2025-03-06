import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'
import { AdminPayoutService } from '../../services/core/AdminPayoutServie'

export class AdminPayoutController {
  static payoutReqAll = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      data: await AdminPayoutService.payOutRequests(query),
    })
  })

  static payoutReqOne = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await AdminPayoutService.payoutById(req.params.id),
      message: 'payouts fetched',
    })
  })

  static payoutReqGroup = Catch.async(async (_, res) => {
    sendResponse({
      res,
      data: await AdminPayoutService.payoutGroups(),
      message: 'payout requests grouped',
    })
  })

  static payoutStatusUpdate = Catch.async(async (req, res) => {
    await AdminPayoutService.updatePayoutStatus({
      payId: req.params.id,
      adminId: GetDefined.loggedInUser(req.user).id,
      payStatus: req.body.status,
    })

    sendResponse({
      res,
      message: 'payout status updated',
    })
  })
}
