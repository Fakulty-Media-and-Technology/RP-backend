import { LiveStreamService } from '../../services/core/LiveStreamService'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class LiveStreamController {
  static createLiveClient = Catch.async(async ({ user, body }, res) => {
    await LiveStreamService.createClient(GetDefined.loggedInUser(user), body)

    sendResponse({
      res,
      message: 'Credentials added to dashboard',
    })
  })

  static liveStreamCredentials = Catch.async(async ({ user }, res) => {
    sendResponse({
      res,
      message: 'clients stream instances',
      data: await LiveStreamService.getLiveStreamCredentials(GetDefined.loggedInUser(user)),
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
    const { start, expiry } = req.query

    sendResponse({
      res,
      message: 'Cost for your event',
      data: LiveStreamService.calcEventCharges(start, expiry),
    })
  })
}
