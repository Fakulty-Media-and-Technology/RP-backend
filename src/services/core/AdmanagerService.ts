import { Request } from 'express'
import { AdmanagerModel } from '../../models/admanager.model'
import { AdManagerRepo } from '../../repositories/AddManagerRepo'
import { QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { OperationalError } from '../../utils/OperationalError'

export class AdManagerService {
  // TODO: Get the types for body
  static addAd = async (body: any) => {
    const { title, sub_title, type, brand, photo, link, duration, start, expiry, active } = body

    const ad = await AdManagerRepo.create({
      title,
      sub_title,
      type,
      brand,
      photo,
      link,
      duration,
      start,
      expiry,
      active,
    })

    return ad
  }

  static getAds = async (query: Request['query']) => {
    const queryFeatures = new QueryParamsFeatures(AdManagerRepo.getAdds().sort({ createdAt: -1 }), {
      queryParams: query,
      defaultLimit: 10,
      defaultPage: 1,
    })


    return await queryFeatures.paginate().query
  }

  static deleteAd = async (addId: string) => {
    const deleted = await AdmanagerModel.findByIdAndDelete(addId)

    if (deleted == null) {
      throw new OperationalError('invalid add Id', 404)
    }
  }
}
