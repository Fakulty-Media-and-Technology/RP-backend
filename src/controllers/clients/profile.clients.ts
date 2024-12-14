import { ClientProfileService } from '../../services/core/ClientProfileService'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class ClientProfileController {
  static clientEditProfile = Catch.async(async ({ user, body }, res) => {
    await ClientProfileService.editProfile(GetDefined.loggedInUser(user), body)

    sendResponse({
      res,
      message: 'Profile Updated',
    })
  })

  static clientsPaymentHis = Catch.async(async ({ user }, res) => {
    sendResponse({
      res,
      message: 'client payment history fetched',
      data: await ClientProfileService.clientsPaymentHis(GetDefined.loggedInUser(user)),
    })
  })

  static clientProfileFetch = Catch.async(async ({ user }, res) => {
    sendResponse({
      res,
      message: 'client profile fetched',
      data: await ClientProfileService.fetchClientProfile(GetDefined.loggedInUser(user)),
    })
  })
}
