import { UpcomingService } from '../../services/core/UpcomingService'
import { Catch } from '../../utils/Catch'

import { sendResponse } from '../../utils/responder'

export class AdminUpcomingController {
  static upcomingsAllGet = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      data: await UpcomingService.adminFetch({
        contentType: query.contentType as any,
        page: query.page,
        limit: query.limit,
      }),
      
      message: 'upcomings fetched',
    })
  })
}
