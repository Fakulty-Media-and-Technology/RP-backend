import { UpdateQuery } from 'mongoose'
import { UserModel, UserSchema } from '../models/users.model'

export class UserRepo {
  static getUserById = (userId: string) => UserModel.findById(userId)

  static getByEmail = (emailAddr: string) => UserModel.findOne({ email: emailAddr })

  static getAdminById = (adminId: string) =>
    UserModel.findOne({ _id: adminId, role: { $in: ['admin', 'superadmin'] } })

  static getAllClientsByRoles = () =>
    UserModel.find({
      role: { $in: ['tvshow', 'channel', 'podcast', 'event'] },
    })

  static updateById = (userId: string, data: UpdateQuery<UserSchema>) =>
    UserModel.findByIdAndUpdate(userId, data, { new: true })

  static getAClient = (clinetId: string) => {
    return UserModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: [
              '$_id',
              {
                $toObjectId: clinetId,
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'payments',
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
              $sort: {
                createdAt: -1,
              },
            },
          ],
          as: 'payment history',
        },
      },
      {
        $project: {
          auth_code: 0,
          auth_expiry: 0,
          approved: 0,
          suspended: 0,
          updatedAt: 0,
          __v: 0,
          pin: 0,
          password: 0,
        },
      },
    ])
  }
}
