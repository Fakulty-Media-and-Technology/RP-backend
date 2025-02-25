import { ClientProfileService } from '../../services/core/ClientProfileService'
import { Catch } from '../../utils/Catch'
import { GetDefined } from '../../utils/GetDefined'
import { sendResponse } from '../../utils/responder'

export class ClientProfileController {
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
