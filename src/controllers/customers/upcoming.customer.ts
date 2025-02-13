import {
  UpcomingService,
  CustomerSubScriptionActionType,
} from '../../services/core/UpcomingService'

import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class CustomerUpcomingController {
  static fetch = Catch.async(async ({ query, user }, res) => {
    sendResponse({
      res,
      data: await UpcomingService.customerFetch(query, GetDefined.loggedInUser(user)),
    })
  })

  static subscription = (type: CustomerSubScriptionActionType) =>
    Catch.async(async ({ user, params: { id } }, res) => {
      await UpcomingService.customerSubscription(GetDefined.loggedInUser(user), id, type)

      sendResponse({
        res,
        message: 'subscription updated successfully',
      })
    })

  static isSubscribed = Catch.async(async ({ user, params: { id } }, res) => {
    const user_subscribed = await UpcomingService.customerIsSubscribed(
      GetDefined.loggedInUser(user),
      id,
    )

    sendResponse({
      res,
      data: { user_subscribed },
      message: 'User subsciption status',
    })
  })
}
