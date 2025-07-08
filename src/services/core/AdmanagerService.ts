import { AdModel, AdSchema } from '../../models/admanager.model'
import { AdManagerRepo } from '../../repositories/AddManagerRepo'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { OperationalError } from '../../utils/OperationalError'
import { MulterFile } from '../../types'
import { MediaManagement } from '../media-management'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { VideoUploadModel } from '../../models/videoupload.model'
import { Purge } from '../../utils/Purge'

export interface CreateAdData
  extends Omit<AdSchema, 'createdAt' | 'updatedAt' | 'video' | 'photo'> {
  videoFile: MulterFile
  imageFile: MulterFile
}

interface UploadMediaInput {
  videoFile: MulterFile
  imageFile: MulterFile
  expire: Date
}

export class AdManagerService {
  protected static _uploadMedia = async ({ videoFile, imageFile, expire }: UploadMediaInput) => {
    const [imageUploadResult, videoUploadResult] = await Promise.allSettled([
      MediaManagement.store({
        file: imageFile,
        baseDir: 'images',
        expire,
      }),

      MediaManagement.uploadAndInitiateMediaConvert({ file: videoFile, expire }),
    ])

    if (imageUploadResult.status === 'rejected') {
      throw imageUploadResult.reason
    }

    if (videoUploadResult.status === 'rejected') {
      throw videoUploadResult.reason
    }

    return {
      imageUpload: imageUploadResult.value,
      videoUpload: videoUploadResult.value,
    }
  }

  static create = async (data: CreateAdData) =>
    await withMongoDBSession(this._createTransaction, data)

  static _createTransaction = async (
    {
      active,
      expiry,
      start,
      duration,
      link,
      videoFile,
      imageFile,
      brand,
      type,
      title,
    }: CreateAdData,
    session: MaybeSession,
  ) => {
    const expireAt = new Date(expiry)

    const { imageUpload, videoUpload } = await this._uploadMedia({
      videoFile,
      imageFile,
      expire: expireAt,
    })

    const adDocument = new AdModel({
      title,
      type,
      brand,
      link,
      duration,
      active,
      expiry: expireAt,
      start: new Date(start),
      photo: {
        Bucket: imageUpload.Bucket,
        Key: imageUpload.Key,
        ContentType: 'image',
      },
    })

    const videoUploadDocument = new VideoUploadModel({
      bucket: videoUpload.Bucket,
      key: videoUpload.Key,
      mimetype: videoUpload.mimetype,
      size: videoUpload.size,
      isTranscoded: videoUpload.isTranscoded,
      parentType: 'ad',
      parentId: adDocument._id,
    })

    adDocument.videoUpload = videoUploadDocument._id
    await adDocument.save({ session })
    await videoUploadDocument.save({ session })
    return adDocument
  }

  static getMany = async (query: ExpressRequestQuery) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const ads = await AdManagerRepo.fetchMany({
      skip,
      limit,
      type: query.type,
    })

    return ads
  }

  static getRandom = async (type: unknown) => {
    const ads = await AdManagerRepo.fetcRandom(type)
    return ads
  }

  static deleteAd = async (addId: string) => {
    const deleted = await AdModel.findByIdAndDelete(addId)

    if (deleted == null) {
      throw new OperationalError('invalid add Id', 404)
    }

    Purge.videoUploadById(deleted.videoUpload)
  }
}
