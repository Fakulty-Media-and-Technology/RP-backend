import { MediaAccess } from '../../../src/services/media-access'
import { MediaManagement } from '../../../src/services/media-management'
import { SuggestionModel } from '../../models/suggestions.model'
import { UserModel } from '../../models/users.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { isValidEmail } from '../../utils/validate'

interface FetchCustomerProfileInput {
  currentUser: LoggedInUser
  currentUserRoleHybrid: string
}

export class CustomerProfileService {
  static fetchCustomerProfile = async ({
    currentUser,
    currentUserRoleHybrid,
  }: FetchCustomerProfileInput) => {
    if (currentUserRoleHybrid === 'guest') {
      throw new OperationalError('You are not authenticated', 403)
    }

    const profile = await UserModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              '$_id',
              {
                $toObjectId: currentUser._id,
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'paymentdetails',
          let: {
            uid: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$user_id',
                    {
                      $toObjectId: '$$uid',
                    },
                  ],
                },
              },
            },
            {
              $project: {
                __v: 0,
                _id: 0,
                user_id: 0,
              },
            },
          ],
          as: 'paymentDetails',
        },
      },
      {
        $addFields: {
          paymentDetails: {
            $arrayElemAt: ['$paymentDetails', 0],
          },
        },
      },
      {
        $lookup: {
          from: 'settings',
          let: {
            cid: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$$cid', '$user_id'],
                },
              },
            },
            {
              $project: {
                createdAt: 0,
                updatedAt: 0,
                __v: 0,
              },
            },
          ],
          as: 'settings_info',
        },
      },
      {
        $set: {
          settings_info: {
            $first: '$settings_info',
          },
        },
      },
      {
        $project: {
          __v: 0,
          password: 0,
          auth_code: 0,
          auth_expiry: 0,
          verified: 0,
          approved: 0,
          suspended: 0,
        },
      },
    ])

    if (!profile.length) {
      return {
        data: {
          profile: null,
          photo_url: 'no profile picture',
        },
        message: 'Customer profile fetched but no profile data',
      }
    }

    const userPhoto = profile[0]?.photo

    if (!userPhoto || !userPhoto.Bucket || !userPhoto.Key) {
      return {
        data: {
          profile: profile[0],
          photo_url: 'no profile picture',
        },
        message: 'Client profile fetched',
      }
    }

    return {
      data: {
        profile: profile[0],
        photo_url: await MediaAccess.getSignedUrl(userPhoto.Bucket, userPhoto.Key, 'photo'),
      },
      message: 'Client profile fetched',
    }
  }

  static createSuggestion = async (currentUser: LoggedInUser, message: string) => {
    const currentUserRole = currentUser.role as string

    if (currentUserRole === 'guest') {
      throw new OperationalError('you are not authenticated', 403)
    }

    await SuggestionModel.create({
      message,
      user_id: currentUser._id,
    })
  }

  static editProfile = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    const { first_name, last_name, country_code, mobile, photo, email, payment } = data

    if (email) {
      if (!isValidEmail(email)) {
        console.log('Invalid email format:', email)
        throw new OperationalError('invalid email format', 400)
      }

      if (await UserModel.findOne({ email: email })) {
        console.log('Email already in use:', email)
        throw new OperationalError('invalid email format', 409)
      }
    }

    if (photo) {
      await MediaManagement.deletePhoto(currentUser.photo)
      currentUser.photo = {}
    }

    const updatedUser = await UserModel.findByIdAndUpdate(currentUser._id, {
      email: email ? email : currentUser.email,
      first_name: first_name ? first_name : currentUser.first_name,
      last_name: last_name ? last_name : currentUser.last_name,
      country_code: country_code ? country_code : currentUser.country_code,
      mobile: mobile ? mobile : currentUser.mobile,
      photo: photo ? photo : currentUser.photo,
    })

    if (updatedUser === null) {
      throw new OperationalError('error updating profile. Please try again', 500)
    }
  }
}
