import { CastEnumSchema, CastEnumDocument } from '../models/castEnum.model'
import { FetchUserAggrRes } from '../repositories/UserRepo'
import { MediaAccess } from '../services/media-access'

export class PhotoUtils {
  static fetchUserAggrResPhoto = async (user: FetchUserAggrRes) => {
    Object.assign(user, {
      photo: user.photo ? MediaAccess.getImageURL(user.photo.Key) : null,
    })

    return user
  }

  static setCastWithPhotoUrl = async (cast: CastEnumSchema | CastEnumDocument) => {
    const pureCast = JSON.parse(JSON.stringify(cast)) as CastEnumSchema

    const withPhotoUrL = {
      ...pureCast,
      photoUrl: MediaAccess.getImageURL(cast.key),
      bucket: undefined,
      key: undefined,
      __v: undefined,
    }

    return withPhotoUrL
  }
}
