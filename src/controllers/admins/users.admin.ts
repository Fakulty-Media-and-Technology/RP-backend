import { UserModel } from '../../models/users.model'
import { Catch } from '../../utils/catchAsync'
import { OperationalError } from '../../utils/OperationalError'
import { Password } from '../../utils/Password'
import { sendResponse } from '../../utils/responder'
import { isValidEmail } from '../../utils/validate'

export class AdminUsersController {
  static adminFetchUser = Catch.async(async (_, res) => {
    const result = await UserModel.aggregate([
      {
        $project: {
          fullname: {
            $concat: ['$first_name', ' ', '$last_name'],
          },
          email: 1,
          totalSub: 1,
          joined: '$createdAt',
          substatus: {
            $cond: {
              if: { $eq: ['$verified', true] },
              then: 'Active',
              else: 'Inactive',
            },
          },
          verified: 1,
        },
      },
    ])

    sendResponse({
      res,
      data: result,
      message: 'User detials fetched',
    })
  })

  static adminFetchSingleUser = Catch.async(async (req, res) => {
    const { userId } = req.params

    const user = await UserModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              '$_id',
              {
                $toObjectId: userId,
              },
            ],
          },
        },
      },
      {
        $project: {
          fullname: {
            $concat: [{ $ifNull: ['$first_name', ''] }, ' ', { $ifNull: ['$last_name', ''] }],
          },
          email: 1,
          mobile: 1,
          gender: 1,
          dob: 1,
          joined: '$createdAt',
          verified: 1,
          substatus: {
            $cond: {
              if: { $eq: ['$verified', true] },
              then: 'Active',
              else: 'Inactive',
            },
          },
        },
      },
    ])

    if (!user) {
      throw new OperationalError('User not found', 404)
    }

    sendResponse({
      res,
      data: user,
      message: 'One user fetched successfully',
    })
  })

  static editUserProfile = Catch.async(async (req, res) => {
    const { userId } = req.params
    const { first_name, last_name, mobile, dob, email, gender, password } = req.body

    if (email && !isValidEmail(email)) {
      throw new OperationalError('Invalid email format', 400)
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        email: email,
        password: await Password.encrypt(password),

        first_name: first_name,
        last_name: last_name,

        mobile: mobile,

        gender: gender,
        dob: dob,
        verified: true,
        approved: true,
      },
      { new: true },
    )

    if (!updatedUser) {
      throw new OperationalError('User not found', 400)
    }

    sendResponse({
      res,
      data: updatedUser,
      message: 'profile updated',
    })
  })

  static adminDeleteUser = Catch.async(async (req, res) => {
    const { userId } = req.params
    const deleteUser = await UserModel.findOneAndDelete({
      _id: userId,
    })

    if (!deleteUser) {
      throw new OperationalError('user can not be deleted or not found', 400)
    }

    sendResponse({
      res,
      message: 'user deleted successfully',
    })
  })
}
