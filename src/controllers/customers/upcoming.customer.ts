import {
  UpcomingService,
  CustomerSubScriptionActionType,
} from '../../services/core/UpcomingService'

import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class CustomerUpcomingController {
  static fetch = Catch.async(async ({ query, user }, res) => {
    const upcoming = await UpcomingService.customerFetch(GetDefined.loggedInUser(user), query)

    sendResponse({
      res,
      data: upcoming,
    })
  })
  

  static subscription = (action: CustomerSubScriptionActionType) =>
    Catch.async(async ({ user, params: { id, contentType } }, res) => {
      await UpcomingService.customerSubscription({
        action,
        currentUser: GetDefined.loggedInUser(user),
        contentId: id,
        contentType: contentType as any,
      })

      sendResponse({
        res,
        message: 'subscription updated successfully',
      })
    })

  static isSubscribed = Catch.async(async ({ user, params: { id, contentType } }, res) => {
    const user_subscribed = await UpcomingService.customerIsSubscribed({
      contentId: id,
      contentType: contentType as any,
      currentUser: GetDefined.loggedInUser(user),
    })

    sendResponse({
      res,
      data: { user_subscribed },
      message: 'User subsciption status',
    })
  })
}
