import { GiftCardService } from '../../services/core/GiftCardService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class AdminGiftCardController {
  static createGiftCard = Catch.async(async ({ body: { amount, currency }, user }, res) => {
    const card = await GiftCardService.createGiftCard({
      currentAdmin: GetDefined.loggedInUser(user),
      currency,
      amount,
    })

    sendResponse({
      res,
      message: 'gift card created',
      data: card,
    })
  })

  static fetchGiftCards = Catch.async(async ({ query }, res) => {
    const cards = await GiftCardService.fetchGiftCards(query)

    sendResponse({
      res,
      message: 'gift cards fetched successfully',
      data: cards,
    })
  })
}
