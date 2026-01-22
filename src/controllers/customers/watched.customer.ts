import { WatchedService } from '../../services/core/WatchedService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class WatchedController {
  static create = Catch.async(async (req, res) => {
    await WatchedService.create({
      currentUserId: GetDefined.loggedInUser(req.user)._id.toString(),
      ...req.body,
    })

    sendResponse({
      res,
    })
  })
  static deleteOneById = Catch.async(async (req, res) => {
    await WatchedService.deleteById(req.params.id)

    sendResponse({
      res,
    })
  })

  static continueWatching = Catch.async(async (req, res) => {
    const watched = await WatchedService.fetchContinueWatching(
      GetDefined.loggedInUser(req.user),
      req.query,
    )

    sendResponse({
      res,
      data: watched,
    })
  })
}
