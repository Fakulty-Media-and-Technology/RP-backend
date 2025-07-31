import { RecentSearchService } from '../../services/core/RecentSearchService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class RecentSearchController {
  static register = Catch.async(async ({ user, body }, res) => {
    await RecentSearchService.register({
      userId: GetDefined.loggedInUser(user)._id.toString(),
      contentId: body.contentId,
      contentType: body.contentType,
    })

    sendResponse({
      res,
    })
  })

  static fetchMany = Catch.async(async ({ user }, res) => {
    const search = await RecentSearchService.fetch(GetDefined.loggedInUser(user)._id.toString())

    sendResponse({
      res,
      data: search,
    })
  })
}
