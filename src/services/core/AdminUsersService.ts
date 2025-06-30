import { S3 } from '../aws/s3'
import { UserModel } from '../../models/users.model'
import { UserRepo } from '../../repositories/UserRepo'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, guranteeNumericResult } from '../../utils/QueryParamsFeatures'
import { PhotoUtils } from '../../utils/photoUtils'
import { getPromiseAllFulfilledResults } from '../../utils/promises'

export class AdminUsersService {
  static fetchAll = async (query: ExpressRequestQuery) => {
    const page = guranteeNumericResult(query.page, 1)
    const limit = guranteeNumericResult(query.limit, 50)
    const users = await UserRepo.adminFetchAllCustomersAggr(page, limit)

    return getPromiseAllFulfilledResults(
      await Promise.allSettled(users.map(PhotoUtils.fetchUserAggrResPhoto)),
    )
  }

  static fetchOne = async (userId: string) => {
    const [user] = await UserRepo.adminFetchSingleCustomerAggr(userId)

    if (!user) {
      throw new OperationalError('User not found', 404)
    }

    return await PhotoUtils.fetchUserAggrResPhoto(user)
  }

  static deleteOne = async (userId: string) => {
    const deletedUser = await UserModel.findByIdAndDelete(userId)

    if (!deletedUser) {
      throw new OperationalError('user can not be deleted or not found', 400)
    }

    if (deletedUser.photo) {
      const {
        photo: { Key, Bucket },
      } = deletedUser

      S3.deleteObject(Key, Bucket).catch(e => {
        console.error(`Error deleted user photo with key: ${Key} and bucket: ${Bucket}`)
        console.error('Reason', e)
      })
    }
  }
}
