import { FeaturedService } from '../../services/core/FeaturedService'
import { Catch } from '../../utils/Catch'
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

  static getFeaturedContents = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await FeaturedService.getFeaturedContents(req.query),
      message: 'contents fetched successful',
    })
  })
}
