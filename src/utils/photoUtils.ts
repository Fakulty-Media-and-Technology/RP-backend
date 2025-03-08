import { FetchUserAggrRes } from '../repositories/UserRepo'
import { MediaAccess } from '../services/media-access'

export class PhotoUtils {
  static fetchUserAggrResPhoto = async (user: FetchUserAggrRes) => {
    Object.assign(user, {
      photo: user.photo
        ? await MediaAccess.getSignedUrl(user.photo.Bucket, user.photo.Key, 'photo')
        : null,
    })

    return user
  }
}
