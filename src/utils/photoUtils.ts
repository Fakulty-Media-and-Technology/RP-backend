import { CastEnumSchema, CastEnumDocument } from '../models/castEnum.model'
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

  static setCastWithPhotoUrl = async (cast: CastEnumSchema | CastEnumDocument) => {
    const pureCast = JSON.parse(JSON.stringify(cast)) as CastEnumSchema

    const withPhotoUrL = {
      ...pureCast,
      photoUrl: await MediaAccess.getSignedUrl(cast.bucket, cast.key, 'photo'),
      bucket: undefined,
      key: undefined,
      __v: undefined,
    }

    return withPhotoUrL
  }
}
