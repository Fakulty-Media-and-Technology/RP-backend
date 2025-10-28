import { MediaAccess } from '../../../src/services/media-access'
import { PaymentModel } from '../../models/payments.model'
import { LoggedInUser } from '../../types'
import { hidePrivateProps } from '../../utils/hide'

export class ClientProfileService {
  static clientsPaymentHis = async (currentUser: LoggedInUser) => {
    const wallHis = await PaymentModel.find({ user_id: currentUser.id }).select('-__v')
    return wallHis
  }

  static fetchClientProfile = async (currentUser: LoggedInUser) => {
    const profile = hidePrivateProps(currentUser)
    const photo_url = !profile.photo ? null : MediaAccess.getImageURL(profile.photo.Key)

    profile.photo = undefined

    return {
      profile,
      photo_url,
    }
  }
}
