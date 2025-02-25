import { UserModel } from '../../models/users.model'
import { Catch } from '../../utils/Catch'
import { OperationalError } from '../../utils/OperationalError'
import { Password } from '../../utils/Password'
import { handleDefaultNumAndUnknown, skip } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'
import { isValidEmail } from '../../utils/validate'

export class AdminUsersController {
  static adminFetchUsers = Catch.async(async ({ query }, res) => {
    const page = handleDefaultNumAndUnknown(query.page, 1)
    const limit = handleDefaultNumAndUnknown(query.limit, 50)

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
      { $skip: skip(page, limit) },
      { $limit: limit },
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

    if (!user.length) {
      throw new OperationalError('User not found', 404)
    }

    sendResponse({
      res,
      data: user,
      message: 'One user fetched successfully',
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
