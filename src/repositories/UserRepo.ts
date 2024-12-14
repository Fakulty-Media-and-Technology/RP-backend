import { UpdateQuery } from 'mongoose'
import { UserModel, UserSchema } from '../models/users.model'

type UserRole = UserSchema['role']
type UserRoles = Array<UserRole>

export class UserRepo {
  static getUserById = (userId: string) => UserModel.findById(userId)

  static getByEmail = (emailAddr: string) => {
    return UserModel.findOne({ email: emailAddr.trim().toLowerCase() })
  }

  static totalUsersCount = () => UserModel.find({}).countDocuments()

  static getAdminById = (adminId: string) => {
    return UserModel.findOne({ _id: adminId, role: { $in: ['admin', 'superadmin'] } })
  }

  static getAllClientsByRoles = (roles: UserRoles = ['tvshow', 'channel', 'podcast', 'event']) => {
    return UserModel.find({
      role: { $in: roles },
    })
  }

  static getClientByRolesAndId = (id: string, roles: UserRoles) => {
    return UserModel.findOne({ _id: id, role: { $in: roles } })
  }

  static updateById = (userId: string, data: UpdateQuery<UserSchema>) => {
    return UserModel.findByIdAndUpdate(userId, data, { new: true })
  }

  static getFreeUsers = async () => {
    return await UserModel.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          let: {
            uid: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        '$user_id',
                        {
                          $toObjectId: '$$uid',
                        },
                      ],
                    },
                    {
                      $eq: ['$active', true],
                    },
                    {
                      $lte: [
                        new Date(),
                        {
                          $toDate: '$expiry_date',
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: 'user_sub',
        },
      },
      {
        $match: {
          $expr: {
            $eq: ['$user_sub', []],
          },
        },
      },
    ])
  }

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
