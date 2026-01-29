import { S3 } from '../aws/s3'
import { UserModel } from '../../models/users.model'
import { UserRepo } from '../../repositories/UserRepo'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { Notification, NotificationPayload } from '../../notifications/notification'
import { MulterFile } from '../../types'
import { MediaManagement } from '../media-management'
import env from '../../env'

export class AdminUsersService {
  static sendAdminMainTopicPushNotification = async (
    payload: Omit<NotificationPayload, 'image'>,
    imageFile?: MulterFile,
  ) => {
    let image: string | undefined = undefined

    if (imageFile) {
      const upload = await MediaManagement.storeImageAndSubtitle(imageFile)
      image = env.CDN_IMAGES_BASE_URL + '/' + upload.Key
    }

    await Notification.sendTopicPushNotification(
      Notification.adminMainTopic,
      {
        ...payload,
        image,
      },
      true,
    )
  }

  static fetchAll = async (query: ExpressRequestQuery) => {
    const { page, limit } = QueryParamsFeatures.paginagteParams(query)
    const users = await UserRepo.adminFetchAllCustomersAggr(page, limit)
    return users
  }

  static fetchOne = async (userId: string) => {
    const [user] = await UserRepo.adminFetchSingleCustomerAggr(userId)

    if (!user) {
      throw new OperationalError('User not found', 404)
    }

    return user
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
