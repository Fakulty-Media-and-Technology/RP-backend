import { CustomerPaymentService } from '../../services/core/CustomenrPaymentService'
import { GiftCardService } from '../../services/core/GiftCardService'
import { PaymentService } from '../../services/core/PaymentService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class CustomerPaymentController {
  static fetchPlans = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await CustomerPaymentService.fetchPlans(req.query),
      message: 'Plans Fetched',
    })
  })

  static createSubscription = Catch.async(async (req, res) => {
    sendResponse({
      res,
      message: await CustomerPaymentService.createSub({
        user: GetDefined.loggedInUser(req.user),
        data: req.body,
      }),
    })
  })

  static userSubStatus = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await CustomerPaymentService.fetchSubStatus(GetDefined.loggedInUser(req.user)),
      message: 'subscription status fetched',
    })
  })

  static fetchWallet = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await PaymentService.fetchWallet(GetDefined.loggedInUser(req.user)),
      message: 'user wallet info',
    })
  })

  static redeemGiftCard = Catch.async(async (req, res) => {
    await GiftCardService.redeem({
      user: GetDefined.loggedInUser(req.user),
      giftCode: req.query.gift_code as string,
    })

    sendResponse({
      res,
      message: 'giftcard has been redeemed and credited to your wallet successfully',
    })
  })
}
