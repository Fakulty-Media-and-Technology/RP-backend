import { Request } from 'express'
import { CastEnumRepo } from '../../repositories/CastEnumRepo'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { MediaManagement } from '../media-management'
import { CastEnumModel } from '../../models/castEnum.model'
import { getPromiseAllFulfilledResults } from '../../utils/promises'
import { PhotoUtils } from '../../utils/photoUtils'

interface CreateCastInput {
  title: string
  link?: string
  selectButtonType?: 'book-now' | 'fan-page'
  name: string
  description: string
  photoFile: Express.Multer.File
}

interface EditCastInput extends Partial<CreateCastInput> {
  castId: string
}

export class CastEnumService {
  static createCast = async ({
    title,
    link,
    selectButtonType,
    name,
    description,
    photoFile,
  }: CreateCastInput) => {
    const imageUpload = await MediaManagement.store({
      file: photoFile,
      expire: undefined,
      baseDir: 'images',
    })

    if (imageUpload.Key == null || imageUpload.Bucket == null) {
      throw new OperationalError('Could not upload photo', 400)
    }

    await CastEnumModel.create({
      title,
      link,
      selectButtonType,
      name,
      description,
      key: imageUpload.Key,
      bucket: imageUpload.Bucket,
    })
  }

  static editCast = async ({ photoFile, castId, ...params }: EditCastInput) => {
    const { title, link, selectButtonType, name, description } = params

    if (Object.keys(params).length === 0 && photoFile == null) {
      throw new OperationalError('Provide at least one property to update', 400)
    }

    const cast = await CastEnumModel.findById(castId)

    if (cast == null) {
      throw new OperationalError('invalis castId', 404)
    }

    if (photoFile) {
      const imageUpload = await MediaManagement.store({
        file: photoFile,
        expire: undefined,
        baseDir: 'images',
      })

      if (imageUpload.Key == null || imageUpload.Bucket == null) {
        throw new OperationalError('Could not upload photo', 400)
      }

      // delete previous photo
      MediaManagement.deleteObject(cast.key, cast.bucket)

      // set new pointers to bucket object
      cast.key = imageUpload.Key
      cast.bucket = imageUpload.Bucket
    }

    cast.title = title ?? cast.title
    cast.name = name ?? cast.name
    cast.description = description ?? cast.description
    cast.link = link ?? cast.link
    cast.selectButtonType = selectButtonType ?? cast.selectButtonType
    await cast.save()
  }

  static searchCasts = async (searchText: string, query: ExpressRequestQuery) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const casts = await CastEnumModel.find({
      name: { $regex: new RegExp(searchText, 'i') },
    })
      .skip(skip)
      .limit(limit)

    const castsWithPhotoUrl = getPromiseAllFulfilledResults(
      await Promise.allSettled(casts.map(PhotoUtils.setCastWithPhotoUrl)),
    )

    return castsWithPhotoUrl
  }

  static getCasts = async (query: Request['query']) => {
    const features = new QueryParamsFeatures(CastEnumRepo.getAllCasts(), {
      defaultLimit: 300,
      defaultPage: 1,
      queryParams: query,
    })

    return await features.paginate().query
  }

  static deleteById = async (castId: string) => {
    const deletedCast = await CastEnumRepo.deleteById(castId)

    if (deletedCast == null) {
      throw new OperationalError('invalid cast Id', 404)
    }
  }
}
