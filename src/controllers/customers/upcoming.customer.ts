import { CustomerUpcomingService } from '../../services/core/CustomerUpcomingService'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class CustomerUpcomingController {
  static upComingFetch = Catch.async(async (_, res) => {
    // TODO: This should be paginated
    sendResponse({
      res,
      data: await CustomerUpcomingService.fetchUpcoming(),
    })
  })

  static upComingSubscribe = Catch.async(async ({ user, params: { id } }, res) => {
    await CustomerUpcomingService.subscribeToUpComing(GetDefined.loggedInUser(user), id)

    sendResponse({
      res,
      message: 'user subscribed to event',
    })
  })

  static upComingIsUserSubscribed = Catch.async(async ({ user, params: { id } }, res) => {
    const user_subscribed = await CustomerUpcomingService.isSubscribedToUpcoming(
      GetDefined.loggedInUser(user),
      id,
    )

    sendResponse({
      res,
      data: { user_subscribed },
      message: 'User subsciption status',
    })
  })

  static upComingUnsubscribe = Catch.async(async ({ user, params: { id } }, res) => {
    await CustomerUpcomingService.unsubscribeFromUpcoming(GetDefined.loggedInUser(user), id)

    sendResponse({
      res,
      message: 'user unsubscribed',
    })
  })
}
