import { LiveRepo } from '../../repositories/LiveRepo'
import { SubscriptionRepo } from '../../repositories/SubscriptionRepo'
import { UserRepo } from '../../repositories/UserRepo'
import { VideoRepo } from '../../repositories/VideoRepo'
import { WalletRepo } from '../../repositories/WalletRepo'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { Password } from '../../utils/Password'

import {
  guranteeNumericResult,
  QueryParamsFeaturesOptions,
} from '../../utils/QueryParamsFeatures'

import { MediaManagement } from '../media-management'
import { MovieMediaSourcesUtils } from '../../utils/MovieMediaSourcesUtils'
import { AdminUploadService } from './AdminUploadService'

function isValidEmail(email: string) {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(email)
}

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
      if (currentUser.photo)
        await MediaManagement.deleteObject(currentUser.photo.Key, currentUser.photo.Bucket)

      currentUser.photo = photo
    }

    await UserRepo.updateById(currentUser.id, {
      email: email ? email : currentUser.email,
      password: password ? await Password.encrypt(password) : currentUser.password,
      first_name: first_name ? first_name : currentUser.first_name,
      last_name: last_name ? last_name : currentUser.last_name,
      country_code: country_code ? country_code : currentUser.country_code,
      mobile: mobile ? mobile : currentUser.mobile,
      photo: photo ? photo : currentUser.photo,
    })
  }

  static fetchVideosByType = async (
    type: any,
    queryParams: QueryParamsFeaturesOptions['queryParams'],
  ) => {
    if (typeof type !== 'string') {
      throw new OperationalError('invalid or missing type', 400)
    }

    const vids = await VideoRepo.fetchByType(
      type as any,
      guranteeNumericResult(queryParams.page, 1),
      guranteeNumericResult(queryParams.limit, 10),
    )

    return await MovieMediaSourcesUtils.resolveMediaSources(
      vids,
      AdminUploadService.resolveWithMediaSources(queryParams),
      '720p',
    )
  }

  static fetchChannels = async (query: QueryParamsFeaturesOptions['queryParams']) => {
    return await LiveRepo.getChannels(
      guranteeNumericResult(query.page, 1),
      guranteeNumericResult(query.limit, 10),
    )
  }

  static fetchBalanceAndUser = async () => {
    const [totBal, totUsers, activeSubscriptions, freeeUsers] = await Promise.all([
      WalletRepo.totalBalance(),
      UserRepo.totalUsersCount(),
      SubscriptionRepo.activeSubs(new Date()),
      UserRepo.getFreeUsers(),
    ])

    return {
      totUsers,
      activeSubscriptions,
      totalBalance: totBal[0] ?? 0,
      freeUsers: freeeUsers.length,
    }
  }

  static totalContentsAndChunks = async () => {
    const [totalVideos, totalMovieSeries, totalMusicVideos, totalSkits, totalActiveEvents] =
      await Promise.all([
        VideoRepo.totalVideosCountQuery(),
        VideoRepo.totalMovieSeriesCountQuery(),
        VideoRepo.totalMusicVideosCountQuery(),
        VideoRepo.totalSkitVideosCOuntQuery(),
        LiveRepo.totalActiveLiveQuery().countDocuments(),
      ])

    return {
      totalSkits,
      totalMovieSeries,
      totalMusicVideos,
      totalActiveEvents,
      totalContents: totalVideos + totalActiveEvents,
    }
  }
}
