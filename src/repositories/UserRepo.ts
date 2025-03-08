import { UpdateQuery, Types, PipelineStage } from 'mongoose'
import { UserModel, UserSchema, User } from '../models/users.model'
import { StringOrObjectId } from '../types'
import { skip } from '../utils/QueryParamsFeatures'
import { toObjectId } from './VideoRepo'

type UserRole = User['role']
type UserRoles = Array<UserRole>

export type FetchUserAggrRes = Pick<
  User,
  | 'email'
  | 'verified'
  | '_id'
  | 'mobile'
  | 'gender'
  | 'dob'
  | 'photo'
  | 'country'
  | 'country_code'
  | 'role'
> & {
  joined: Date
  fullname: string
  substatus: 'Active' | 'Inactive'
  totalSub: number | undefined | null
}

export class UserRepo {
  static getUserById = (userId: StringOrObjectId) => UserModel.findById(userId)

  static getByEmail = (emailAddr: string) => {
    return UserModel.findOne({ email: emailAddr.trim().toLowerCase() })
  }

  static totalUsersCount = () => UserModel.find({}).countDocuments()

  static getAdminById = (adminId: StringOrObjectId) => {
    return UserModel.findOne({ _id: adminId, role: { $in: ['admin', 'superadmin'] } })
  }

  static getAllClientsByRoles = (roles: UserRoles = ['tvshow', 'channel', 'podcast', 'event']) => {
    return UserModel.find({
      role: { $in: roles },
    })
  }

  static getClientByRolesAndId = (id: StringOrObjectId, roles: UserRoles) => {
    return UserModel.findOne({ _id: id, role: { $in: roles } })
  }

  static updateById = (userId: StringOrObjectId, data: UpdateQuery<UserSchema>) => {
    return UserModel.findByIdAndUpdate(userId, data, { new: true })
  }

  static searchUsersByRegexQuery = (searchReg: RegExp) =>
    UserModel.find({
      role: { $in: ['channel', 'tvshow', 'event', 'podcast'] },
      $or: [
        { first_name: { $regex: searchReg } },
        { last_name: { $regex: searchReg } },
        { email: { $regex: searchReg } },
      ],
    }).select('_id first_name last_name role')

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
          localField: '_id',
          foreignField: 'user_id',
          as: 'payment history',

          pipeline: [
            {
              $sort: {
                createdAt: -1,
              },
            },
          ],
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

  private static _adminFetchUsers = async (
    match: PipelineStage.Match,
    page: number,
    limit: number,
    showPaymentHistory = false,
  ) => {
    const pipeline: PipelineStage[] = [
      match,
      {
        $project: {
          fullname: {
            $concat: ['$first_name', ' ', '$last_name'],
          },
          mobile: true,
          country: true,
          gender: true,
          dob: true,
          photo: true,
          country_code: true,
          role: true,
          email: true,
          totalSub: true,
          joined: '$createdAt',
          substatus: {
            $cond: {
              if: { $eq: ['$verified', true] },
              then: 'Active',
              else: 'Inactive',
            },
          },
          verified: true,
        },
      },
      { $skip: skip(page, limit) },
      { $limit: limit },
    ]

    if (showPaymentHistory) {
      pipeline.push({
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'user_id',
          as: 'payment history',
        },
      })
    }

    const result = (await UserModel.aggregate(pipeline)) as Array<FetchUserAggrRes>
    return result
  }

  static adminFetchClientAggrById = async (clientId: string) => {
    return this._adminFetchUsers({ $match: { _id: toObjectId(clientId) } }, 1, 1, true)
  }

  static adminFetchAllClientsAggr = async (page: number, limit: number) => {
    return this._adminFetchUsers(
      { $match: { role: { $in: ['tvshow', 'channel', 'podcast', 'event'] } } },
      page,
      limit,
    )
  }
  static adminFetchAllUsersAggr = async (page: number, limit: number) => {
    return this._adminFetchUsers({ $match: {} }, page, limit)
  }

  static adminFetchSingleUserAggr = (userId: string) => {
    return this._adminFetchUsers({ $match: { _id: toObjectId(userId) } }, 1, 1)
  }
}
