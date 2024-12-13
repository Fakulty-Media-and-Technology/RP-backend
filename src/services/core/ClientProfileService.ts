import { PaymentModel } from "../../models/payments.model"
import { UserModel } from "../../models/users.model"
import { LoggedInUser } from "../../types"
import { readPhotos } from "../media-access"

export class ClientProfileService {
    static editProfile = async (currentUser: LoggedInUser, data: Record<string, any>) => {
      const { first_name, last_name, country_code, mobile, photo } = data
  
      const updatedClient = await UserModel.findByIdAndUpdate(
        currentUser.id,
        {
          first_name: first_name ? first_name : currentUser.first_name,
          last_name: last_name ? last_name : currentUser.last_name,
          country_code: country_code ? country_code : currentUser.country_code,
          mobile: mobile ? mobile : currentUser.mobile,
          photo: photo ? photo : currentUser.photo,
        },
        { new: true },
      )
  
      return updatedClient
    }
  
    static clientsPaymentHis = async (currentUser: LoggedInUser) => {
      const wallHis = await PaymentModel.find({ user_id: currentUser.id })
      return wallHis
    }
  
    static fetchClientProfile = async (currentUser: LoggedInUser) => {
      const user = currentUser
  
      const profile = await UserModel.aggregate([
        {
          $match: {
            $expr: {
              $eq: [
                '$_id',
                {
                  $toObjectId: user._id,
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'wallets',
            let: {
              cid: '$_id',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      '$user_id',
                      {
                        $toObjectId: '$$cid',
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  balance: 1,
                },
              },
            ],
            as: 'wallet_bal',
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
          $project: {
            auth_code: 0,
            auth_expiry: 0,
            verified: 0,
            approved: 0,
            suspended: 0,
            updatedAt: 0,
            __v: 0,
            pin: 0,
            password: 0,
          },
        },
      ])
  
      const signedUrl = await readPhotos(profile[0]?.photo?.Bucket, profile[0]?.photo?.Key)
  
      return {
        profile: profile[0],
        photo_url:
          typeof signedUrl !== 'string' && signedUrl.status == 400 ? 'no profile picture' : signedUrl,
      }
    }
  }