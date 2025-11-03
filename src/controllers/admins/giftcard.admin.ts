import { GiftCardService } from '../../services/core/GiftCardService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class AdminGiftCardController {
  static create = Catch.async(async ({ body: { amount, currency }, user }, res) => {
    const card = await GiftCardService.create({
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

  static fetch = Catch.async(async ({ query }, res) => {
    const cards = await GiftCardService.fetch(query)

    sendResponse({
      res,
      message: 'gift cards fetched successfully',
      data: cards,
    })
  })

  static activate = Catch.async(async ({ params }, res) => {
    await GiftCardService.activate(params.code, params.token)

    sendResponse({
      res,
      message: 'activated',
    })
  })

  static deleteById = Catch.async(async ({ params }, res) => {
    await GiftCardService.deleteById(params.id)

    sendResponse({
      res,
    })
  })

  static merchantNotifyIsUsed = Catch.async(async ({ params }, res) => {
    await GiftCardService.setMerchactCardIsUsed(params.code, params.email)

    sendResponse({
      res,
    })
  })

  static getMerchantCards = Catch.async(async ({ params, query }, res) => {
    const cards = await GiftCardService.getMerchantCards({
      query,
      currency: params.currency,
      merchantEmail: params.email,
    })

    sendResponse({
      res,
      data: cards,
    })
  })
}
