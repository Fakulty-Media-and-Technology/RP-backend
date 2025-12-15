import { AdModel, AdSchema } from '../../models/admanager.model'
import { AdManagerRepo, FetchAdResult } from '../../repositories/AddManagerRepo'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { OperationalError } from '../../utils/OperationalError'
import { MulterFile } from '../../types'
import { MediaManagement } from '../media-management'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { Purge } from '../../utils/Purge'
import { VideoQuality, VidUploadUtils } from '../../utils/VideoUploadUtils'
import { MediaAccess } from '../media-access'
import { UploadMediaUtils } from '../../utils/UploadMediaUtils'

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
  protected static _resolveMediaSources = async (ads: FetchAdResult[], userId?: string) => {
    const videoQuality: VideoQuality = userId
      ? await VidUploadUtils.getUserVideoQuality(userId)
      : '720p'

    return ads.map(ad => ({
      photoUrl: MediaAccess.getImageAndSubtitleURL(ad.photo.Key),
      videoUrl: VidUploadUtils.getResSourceUrl(ad.videoUpload, videoQuality),
      photo: undefined,
      videoUpload: undefined,
      __v: undefined,
    }))
  }

  protected static _uploadMedia = async ({ videoFile, imageFile, expire }: UploadMediaInput) => {
    const [imageUploadResult, videoUploadResult] = await Promise.allSettled([
      MediaManagement.storeImageAndSubtitle(imageFile, expire),
      MediaManagement.uploadAndInitiateMediaConvert(videoFile, expire),
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
      },
    })

    const videoUploadDocument = UploadMediaUtils.getVideoUploadDocument(videoUpload)
    videoUploadDocument.parentId = adDocument._id
    videoUploadDocument.parentType = 'ad'
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

  static getRandom = async (type: unknown) => {
    const ads = await AdManagerRepo.fetcRandom(type)
    return await this._resolveMediaSources(ads)
  }

  static deleteAd = async (addId: string) => {
    const deletedAdDocument = await AdModel.findByIdAndDelete(addId)

    if (deletedAdDocument == null) {
      throw new OperationalError('invalid add Id', 404)
    }

    MediaManagement.deleteObject(deletedAdDocument.photo.Key, deletedAdDocument.photo.Bucket)
    Purge.videoUploadById(deletedAdDocument.videoUpload)
  }
}
