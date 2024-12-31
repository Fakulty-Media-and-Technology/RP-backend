import { FeaturedService } from '../../services/core/FeaturedService'
import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'

export class AdminFeaturedController {
  static searchContents = Catch.async(async ({ query: { text } }, res) => {
    sendResponse({
      res,
      message: 'contents fetched successful',
      data: await FeaturedService.searchVideosByText(text as string),
    })
  })

  static addFeatured = Catch.async(async ({ body: { type, id, expiry } }, res) => {
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
