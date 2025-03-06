import { CustomerPaymentService } from '../../services/core/CustomenrPaymentService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { sendResponse } from '../../utils/responder'

export class CustomerPaymentController {
  static startPayment = Catch.async(async ({ user, body }, res) => {
    sendResponse({
      res,
      data: await CustomerPaymentService.startPayment(GetDefined.loggedInUser(user), body),
      message: 'payment initiated',
    })
  })

  static authorizePayment = Catch.async(async ({ user, body: { amount_charge } }, res) => {
    sendResponse({
      res,
      message: 'payment authorization successfull',
      data: await CustomerPaymentService.authorizePayment(
        GetDefined.loggedInUser(user),
        amount_charge,
      ),
    })
  })

  static createPayment = Catch.async(async ({ user, body }, res) => {
    sendResponse({
      res,
      message: 'payment created and authorization activated',
      data: await CustomerPaymentService.createPayment(GetDefined.loggedInUser(user), body),
    })
  })

  static getPaymentReceipt = Catch.async(async (req, res) => {
    const { reference } = req.query

    if (typeof reference !== 'string') {
      throw new OperationalError('required query.reference must be a string', 400)
    }

    sendResponse({
      res,
      data: await CustomerPaymentService.getPaymentRecepit(reference),
      message: 'Payment initiated',
    })
  })

  static transactionHistory = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await CustomerPaymentService.getTransactionHistory(GetDefined.loggedInUser(req.user)),
      message: 'transaction history fetched',
    })
  })

  static addPayment = Catch.async(async ({ user, body }, res) => {
    await CustomerPaymentService.addPayment(GetDefined.loggedInUser(user), body)

    sendResponse({
      res,
      message: 'Payment added successfully',
    })
  })

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

  static topupWallet = Catch.async(async (req, res) => {
    await CustomerPaymentService.topUpWallet({
      user: GetDefined.loggedInUser(req.user),
      reference: req.body.reference,
    })

    sendResponse({
      res,
      message: 'top up successful',
    })
  })

  static fetchWallet = Catch.async(async (req, res) => {
    sendResponse({
      res,
      data: await CustomerPaymentService.fetchWallet(GetDefined.loggedInUser(req.user)),
      message: 'user allet info',
    })
  })

  static redeemGiftCard = Catch.async(async (req, res) => {
    await CustomerPaymentService.redeemGiftCard({
      user: GetDefined.loggedInUser(req.user),
      giftCode: req.query.gift_code as string,
    })

    sendResponse({
      res,
      message: 'giftcard has been redeemed and credited to your wallet successfully',
    })
  })
}
