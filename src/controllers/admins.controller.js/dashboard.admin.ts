import { VideoModel } from '../../../build/src/models/videos.model'
import { LiveVideoRepo } from '../../repositories/LiveRepo'
import { PosterImageRepo } from '../../repositories/PosterImageRepo'
import { UserRepo } from '../../repositories/UserRepo'
import { VideoRepo } from '../../repositories/VideoRepo'
import { LoggedInUser } from '../../types'
import { Catch } from '../../utils/catchAsync'
import { GetDefined } from '../../utils/GetDefined'
import { OperationalError } from '../../utils/OperationalError'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { sendResponse } from '../../utils/responder'

// ....
const Video = require('../../models/videos.model')
const User = require('../../models/users.model')
const Wallet = require('../../models/wallet.model')

const LiveVideos = require('../../models/lives.model')
const {
  serverError,
  successResponse,
  failedResponse,
  invalidRequest,
} = require('../../utils/responder.ts')
const UsersModel = require('../../models/users.model')
const { EncryptPass } = require('../../utils/Password')
const { deletePhoto } = require('../../services/media-management')
const { readPhotos } = require('../../services/media-access')
const PosterModel = require('../../models/poster.model')
const SubscriptionModel = require('../../models/subscription.model')

function isValidEmail(email: string) {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(email)
}

import { Request } from 'express'

export class DashboardService {
  static getCurrentAdminProfile = async (adminId: string) => {
    const admin = await UserRepo.getAdminById(adminId)

    if (admin == null) {
      throw new OperationalError('invalid admin', 403)
    }
    return admin
  }

  // TODO: update the type for data
  static editAdminProfile = async (currentUser: LoggedInUser, data: any) => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
      throw new OperationalError('current user is not an admin', 403)
    }

    const { first_name, last_name, country_code, mobile, photo, email, password } = data

    if (email) {
      if (!isValidEmail(email)) {
        throw new OperationalError('invalid email format', 400)
      }

      if (await UserRepo.getByEmail(email)) {
        throw new OperationalError('Email already in use', 409)
      }
    }

    if (photo) {
      await deletePhoto(currentUser.photo)
      currentUser.photo = {}
    }

    await UserRepo.updateById(currentUser.id, {
      email: email ? email : currentUser.email,
      password: password ? await EncryptPass(password) : currentUser.password,
      first_name: first_name ? first_name : currentUser.first_name,
      last_name: last_name ? last_name : currentUser.last_name,
      country_code: country_code ? country_code : currentUser.country_code,
      mobile: mobile ? mobile : currentUser.mobile,
      photo: photo ? photo : currentUser.photo,
    })
  }

  static fetchVideosByType = async (type: unknown, queryParams: Request['query']) => {
    if (typeof type !== 'string') {
      throw new OperationalError('invalid or missing type', 400)
    }

    const features = new QueryParamsFeatures(
      VideoRepo.findByType(type).select('-__v').sort({ createdAt: -1 }),
      {
        queryParams,
        defaultLimit: 5,
      },
    ).paginate()

    const videos = await features.query

    const finalVideos = await Promise.all(
      videos.map(async video => {
        const finalVideo = {
          ...video,
          photo: {},
        }

        const vidPoster = await PosterImageRepo.findByVideoId(video.id)

        if (vidPoster) {
          finalVideo.photo = await readPhotos(vidPoster.bucket, vidPoster.key)
        }

        return finalVideo
      }),
    )

    return finalVideos
  }

  static fetchChannels = async (query: Request['query']) => {
    const features = new QueryParamsFeatures(
      LiveVideoRepo.getChannels().select('title cover_photo'),
      {
        queryParams: query,
        defaultLimit: 4000,
        defaultPage: 1,
      },
    ).paginate()

    return await features.query
  }
}

export class DashboardController {
  static fetchChannels = Catch.async(async ({ query }, res) => {
    sendResponse({
      res,
      statusCode: 200,
      message: 'admin profile',
      data: await DashboardService.fetchChannels(query),
    })
  })

  static currentAdminProfile = Catch.async(async ({ user }, res) => {
    const currentUser = GetDefined.loggedInUser(user)
    const currentAdmin = await DashboardService.getCurrentAdminProfile(currentUser.id)

    sendResponse({
      res,
      statusCode: 200,
      message: 'admin profile',
      data: currentAdmin,
    })
  })

  static editAdminProfile = Catch.async(async ({ user }, res) => {
    const currentUser = GetDefined.loggedInUser(user)
    const { first_name, last_name, country_code, mobile, photo, email, password } = body

    await DashboardService.editAdminProfile(currentUser, {
      first_name,
      last_name,
      country_code,
      mobile,
      photo,
      email,
      password,
    })

    sendResponse({
      res,
      statusCode: 200,
      message: 'admin profile',
      data: null,
    })
  })

  static fetchVideosByType = Catch.async(async ({ query }, res) => {
    const videos = await DashboardService.fetchVideosByType(query.type, query)

    sendResponse({
      res,
      statusCode: 200,
      message: 'videos fetched by types',
      data: videos,
    })
  })
  
  static adminFetchChannel = Catch.async(async ({ query }, res) => {
    const channels = await DashboardService.fetchChannels(query)

    sendResponse({
      res,
      statusCode: 200,
      message: 'videos fetched by types',
      data: channels,
    })
  })
}

// Function to fetch total balance and total number of users
exports.adminFetchBalanceAndUser = async (req, res) => {
  try {
    const totBal = await Wallet.aggregate([
      {
        $match: {
          $expr: {
            $ne: ['$user_id', null],
          },
        },
      },
      {
        $group: {
          _id: null,
          total_balance: { $sum: '$balance' },
        },
      },
      {
        $project: {
          _id: 0,
          total_balance: 1,
        },
      },
    ])

    const totUsers = await UsersModel.aggregate([
      {
        $match: {
          $expr: {
            $ne: ['$_id', null],
          },
        },
      },
    ])

    const activeSubs = await SubscriptionModel.aggregate([
      {
        $match: {
          $expr: {
            $and: [
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
    ])

    const freeeUsers = await UsersModel.aggregate([
      {
        $match: {
          $expr: {
            $ne: ['$_id', null],
          },
        },
      },
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

    return successResponse(
      res,
      200,
      {
        totalBalance: totBal[0],
        totUsers: totUsers.length,
        freeUsers: freeeUsers.length,
        activeSubscriptions: activeSubs.length,
      },
      'Dashboard Balance and Users',
    )
  } catch (error) {
    console.error('Error fetching total balance and users:', error)
    return serverError(res, 500, null, 'error in calculating the total balance and user')
  }
}

exports.totContentsAndChunks = async (req, res) => {
  try {
    const totVideos = await Video.aggregate([
      {
        $match: {
          $expr: {
            $ne: ['$_id', null],
          },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])

    const totMovSeries = await Video.aggregate([
      {
        $match: {
          $expr: {
            $or: [
              {
                $eq: ['$type', 'movie'],
              },
              {
                $eq: ['$type', 'series'],
              },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])

    const totMusVid = await Video.aggregate([
      {
        $match: {
          $expr: {
            $eq: ['$type', 'music video'],
          },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])

    const totSkit = await Video.aggregate([
      {
        $match: {
          $expr: {
            $eq: ['$type', 'skit'],
          },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])

    const totActiveEvents = await LiveVideos.aggregate([
      {
        $match: {
          $expr: {
            $eq: ['$active', true],
          },
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])

    return successResponse(
      res,
      200,
      {
        totalContents: totVideos.length + totActiveEvents.length,
        totalMovieSeries: totMovSeries.length,
        totalMusicVideos: totMusVid.length,
        totalSkits: totSkit.length,
        totalActiveEvents: totActiveEvents.length,
      },
      'total contents and chunks',
    )
  } catch (error) {
    return serverError(res, 500, null, error.message)
  }
}
