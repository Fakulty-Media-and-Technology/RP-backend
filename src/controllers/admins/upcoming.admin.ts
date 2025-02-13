import { UpcomingData, UpcomingService } from '../../services/core/UpcomingService'
import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'

import { validate } from '../../middlewares/requestValidator'
import { sendResponse } from '../../utils/responder'
import { checkFiles } from './uploads.admin'
import { createUpcomingEventSchema } from '../../validations/admin'

export class AdminUpcomingController {
  static createUpcomingEvent = Catch.async(async ({ body, files: reqFiles }, res) => {
    const { data: _data } = body

    if (_data == null || typeof _data !== 'string') {
      throw new OperationalError(
        'formData.data is required and must be a JSON serialized string',
        400,
      )
    }

    const files = checkFiles(reqFiles)

    if (Object.keys(files).length === 0) {
      throw new OperationalError('Expected at least one file', 400)
    }

    const data: UpcomingData = {
      ...JSON.parse(body.data),
      portraitPhoto: files.portraitPhoto?.[0],
      landscapePhoto: files.landscapePhoto?.[0],
      trailer: files.trailer?.[0],
    }

    validate(createUpcomingEventSchema, data)

    sendResponse({
      res,
      data: await UpcomingService.adminCreate(data),
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
