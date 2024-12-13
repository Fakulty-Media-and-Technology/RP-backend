import { FeaturedService } from '../../services/core/FeaturedService'
import { Catch } from '../../utils/catchAsync'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'

export class FeaturedController {
  static searchContents = Catch.async(async ({ query: { text } }, res) => {
    sendResponse({
      res,
      message: 'contents fetched successful',
      data: await FeaturedService.searchVideosByText(text as string),
    })
  })

  static addFeatured = Catch.async(async ({ body: { type, id, expiry } }, res) => {
    // TODO: Use Joi or Yup

    if (!['vod', 'event'].includes(type)) {
      throw new OperationalError("type of content must be specified 'vod or event'", 400)
    }

    if (!type || !id || !expiry) {
      throw new OperationalError('all inputs are required', 400)
    }

    await FeaturedService.addFeatured({ id, type, expiry })

    sendResponse({
      res,
      message: 'Featured Added',
    })
  })

  static getFeaturedContents = Catch.async(async (_, res) => {
    sendResponse({
      res,
      data: await FeaturedService.getFeaturedContents(),
      message: 'contents fetched successful',
    })
  })
}
