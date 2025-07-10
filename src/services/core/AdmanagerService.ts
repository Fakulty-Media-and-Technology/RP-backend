import { AdModel, AdSchema } from '../../models/admanager.model'
import { AdManagerRepo, FetchAdResult } from '../../repositories/AddManagerRepo'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { OperationalError } from '../../utils/OperationalError'
import { MulterFile } from '../../types'
import { MediaManagement } from '../media-management'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { VideoUploadModel } from '../../models/videoupload.model'
import { Purge } from '../../utils/Purge'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'
import { getPromiseAllFulfilledResults } from '../../utils/promises'
import { MediaAccess } from '../media-access'

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
  protected static _resolveMediaSources = async (ads: FetchAdResult[], userId: string) => {
    const videoQuality = await VidUploadUtils.getUserVideoQuality(userId)

    return getPromiseAllFulfilledResults(
      await Promise.allSettled(
        ads.map(async ad => {
          const [photoSrcResult, videoSourceResult] = await Promise.allSettled([
            MediaAccess.getSignedUrl(ad.photo.Bucket, ad.photo.Key, 'photo'),
            VidUploadUtils.getResSourceUrl(ad.videoUpload, videoQuality),
          ])

          if (photoSrcResult.status === 'rejected') {
            throw photoSrcResult.reason
          }

          if (videoSourceResult.status === 'rejected') {
            throw videoSourceResult.reason
          }

          return Object.assign(ad, {
            photoUrl: photoSrcResult.value,
            videoUrl: videoSourceResult.value,
            photo: undefined,
            videoUpload: undefined,
            __v: undefined,
          })
        }),
      ),
    )
  }

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
      cta,
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
      cta,
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

  static getMany = async (currentUserId: string, query: ExpressRequestQuery) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const ads = await AdManagerRepo.fetchMany({
      skip,
      limit,
      type: query.type,
    })

    return await this._resolveMediaSources(ads, currentUserId)
  }

  static getRandom = async (currentUserId: string, type: unknown) => {
    const ads = await AdManagerRepo.fetcRandom(type)
    return await this._resolveMediaSources(ads, currentUserId)
  }

  static deleteAd = async (addId: string) => {
    const deleted = await AdModel.findByIdAndDelete(addId)

    if (deleted == null) {
      throw new OperationalError('invalid add Id', 404)
    }

    Purge.videoUploadById(deleted.videoUpload)
  }
}
