import { MediaAccess } from '../../../src/services/media-access'
import { PaymentModel } from '../../models/payments.model'
import { UserModel } from '../../models/users.model'
import { LoggedInUser } from '../../types'

export class ClientProfileService {
  private static _deselect = {
    auth_code: 0,
    auth_expiry: 0,
    verified: 0,
    approved: 0,
    suspended: 0,
    updatedAt: 0,
    __v: 0,
    pin: 0,
    password: 0,
  }

  static editProfile = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    const updatedClient = await UserModel.findByIdAndUpdate(currentUser.id, data, {
      new: true,
    }).select(this._deselect)

    return updatedClient
  }

  static clientsPaymentHis = async (currentUser: LoggedInUser) => {
    const wallHis = await PaymentModel.find({ user_id: currentUser.id }).select('-__v')
    return wallHis
  }

  static fetchClientProfile = async (currentUser: LoggedInUser) => {
    const profile = await UserModel.aggregate([
      {
        $match: {
          _id: currentUser._id,
        },
      },
      {
        $lookup: {
          from: 'wallets',
          localField: '_id',
          foreignField: 'user_id',
          as: 'wallet_bal',
          pipeline: [
            {
              $project: {
                balance: 1,
              },
            },
          ],
        },
      },
      {
        $set: {
          wallet_bal: {
            $first: '$wallet_bal',
          },
        },
      },
      {
        $project: this._deselect,
      },
    ])

    const _profile = profile[0]
    const _photo_url = await MediaAccess.getSignedUrl(
      _profile.photo?.Bucket,
      _profile.photo?.Key,
      'photo',
    )

    return {
      profile: _profile,
      photo_url: _photo_url,
    }
  }
}
