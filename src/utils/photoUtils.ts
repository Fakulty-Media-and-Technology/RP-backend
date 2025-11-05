import { CastEnumSchema, CastEnumDocument } from '../models/castEnum.model'
import { MediaAccess } from '../services/media-access'

export class PhotoUtils {
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
