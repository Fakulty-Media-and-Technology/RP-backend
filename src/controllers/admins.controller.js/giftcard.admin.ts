import { GiftCardService } from '../../services/core/GiftCardService'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { handleDefaultNumAndUnkown } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'

export class GiftCardController {
  static createGiftCard = Catch.async(async ({ body: { amount }, user }, res) => {
    sendResponse({
      res,
      message: 'gift card created',
      data: await GiftCardService.createGiftCard(GetDefined.loggedInUser(user), amount),
    })
  })

  static fetchGiftCards = Catch.async(async ({ query }, res) => {
    const page = handleDefaultNumAndUnkown(query.page, 1)
    const limit = handleDefaultNumAndUnkown(query.limit, 10)

    sendResponse({
      res,
      message: 'gift cards fetched successfully',
      data: await GiftCardService.fetchGiftCards(page, limit),
    })
  })
}
