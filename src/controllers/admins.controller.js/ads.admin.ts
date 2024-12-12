import { Catch } from '../../utils/catchAsync'
import { sendResponse } from '../../utils/responder'
import { AdManagerService } from '../../services/core/AdmanagerService'

export class AdsController {
  static addAds = Catch.async(async (req, res) => {
    const { title, sub_title, type, brand, photo, link, duration, start, expiry, active } = req.body

    const ad = await AdManagerService.addAd({
      title,
      sub_title,
      type,
      brand,
      photo,
      link,
      duration,
      start,
      expiry,
      active,
    })

    sendResponse({
      res,
      statusCode: 204,
      message: `${ad.title} added`,
      data: ad,
    })
  })

  static getAds = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      statusCode: 200,
      data: await AdManagerService.getAds(query),
      message: 'ads fetched',
    })
  })

  static removeAd = Catch.async(async ({ params: { id: addId } }, res) => {
    await AdManagerService.deleteAd(addId)

    sendResponse({
      res,
      statusCode: 200,
      data: null,
      message: 'ad deleted',
    })
  })
}
