import { LiveStreamService } from '../../services/core/LiveStreamService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class ClientLiveStreamController {
  static getLiveStreamCredentials = Catch.async(async ({ user, query }, res) => {
    sendResponse({
      res,
      message: 'clients stream instances',
      data: await LiveStreamService.getLiveStreamCredentials(GetDefined.loggedInUser(user), query),
    })
  })

  static extendLiveEvent = Catch.async(async ({ user, body }, res) => {
    await LiveStreamService.extendLiveEvent(GetDefined.loggedInUser(user), body)

    sendResponse({
      res,
      message: 'Live event extended',
    })
  })

  static calculateEventCharges = Catch.sync((req, res) => {
    const { start, expiry, currency } = req.query

    sendResponse({
      res,
      message: 'Cost for your event',
      data: LiveStreamService.calcEventCharges(start as any, expiry as any, currency as any),
    })
  })
}
