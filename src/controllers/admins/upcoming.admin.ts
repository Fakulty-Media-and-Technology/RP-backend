import { UpcomingService } from '../../services/core/UpcomingService'
import { Catch } from '../../utils/Catch'

import { sendResponse } from '../../utils/responder'

export class AdminUpcomingController {
  static createUpcomingEvent = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await UpcomingService.adminCreate(req.body),
      message: 'upcoming event created',
    })
  })

  static upcomingsAllGet = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      data: await UpcomingService.adminFetch(query),
      message: 'all upcomings fetched',
    })
  })
}
