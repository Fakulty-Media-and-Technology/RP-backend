import { MediaAccess } from '../../../src/services/media-access'
import { PaymentModel } from '../../models/payments.model'
import { WalletModel } from '../../models/wallet.model'
import { LoggedInUser } from '../../types'
import { hidePrivateProps } from '../../utils/hide'

export class ClientProfileService {
  static clientsPaymentHis = async (currentUser: LoggedInUser) => {
    const wallHis = await PaymentModel.find({ user_id: currentUser.id }).select('-__v')
    return wallHis
  }

  static fetchClientProfile = async (currentUser: LoggedInUser) => {
    const profile = hidePrivateProps(currentUser)

    const photo_url = !profile.photo
      ? null
      : await MediaAccess.getSignedUrl(profile.photo.Bucket, profile.photo.Key, 'photo')

    profile.photo = undefined

    const wallet = await WalletModel.findOne({ user_id: currentUser._id }).select('balance')

    // Object.assign(profile, { wallet_bal: wallet?.balance ?? 0 })

    return {
      profile,
      photo_url,
    }
  }
}
