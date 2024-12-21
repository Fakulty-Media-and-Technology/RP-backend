import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'
import { CustomerProfileService } from '../../services/core/CustomerProfileService'

export class CustomerProfileController {
  static customerProfileFetch = Catch.async(async ({ user }, res) => {
    const currentUser = GetDefined.loggedInUser(user)

    const result = await CustomerProfileService.fetchCustomerProfile({
      currentUser,
      currentUserRoleHybrid: currentUser.role as string,
    })

    sendResponse({
      res,
      data: result.data,
      message: result.message,
    })
  })

  static createSuggestion = Catch.async(async ({ user, body }, res) => {
    await CustomerProfileService.createSuggestion(GetDefined.loggedInUser(user), body.message)

    sendResponse({
      res,
      message: 'suggestion created and submitted to the admin',
    })
  })

  static editProfile = Catch.async(async ({ user, body }, res) => {
    await CustomerProfileService.editProfile(GetDefined.loggedInUser(user), body)

    sendResponse({
      res,
      message: 'Profile and payment details updated',
    })
  })
}
