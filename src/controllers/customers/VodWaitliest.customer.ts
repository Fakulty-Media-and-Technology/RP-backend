import { VODWaitlistService } from '../../services/core/VODWaitlistService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class VODWaitlistController {
  static add = Catch.async(async (req, res) => {
    await VODWaitlistService.add(GetDefined.loggedInUser(req.user)._id, req.params.videoId)

    sendResponse({
      res,
    })
  })

  static remove = Catch.async(async (req, res) => {
    await VODWaitlistService.remove(GetDefined.loggedInUser(req.user)._id, req.params.videoId)

    sendResponse({
      res,
    })
  })

  static fetch = Catch.async(async (req, res) => {
    const videos = await VODWaitlistService.fetch(GetDefined.loggedInUser(req.user)._id, req.query)

    sendResponse({
      res,
      data: videos,
    })
  })
}
