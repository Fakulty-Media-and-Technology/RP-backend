import { SettingsModel } from '../../models/userSettings.model'
import { VideoUploadModel } from '../../models/videoupload.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { MediaAccess } from '../media-access'
import { ClientSession } from 'mongoose'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { LiveModel } from '../../models/lives.model'
import { PaymentModel } from '../../models/payments.model'
import { UserRepo } from '../../repositories/UserRepo'
import { calcLiveCharges, getUniqueStreamKey } from '../../utils/live'
import { MediaManagement } from '../media-management'
import { PosterImageModel } from '../../models/poster.model'

export type CreateLiveData = {
  clientId: string
  title: string
  pg: string
  vidClass: string
  type: string
  start: string
  expiry: string
  description?: string
  location?: string
  coverPhoto: Express.Multer.File
  previewVideo?: Express.Multer.File
  sponsored?: boolean
  popular?: boolean
  paymentId?: string
  creatorType: 'admin' | 'client'
}

type ProcessCreateLivePaymentParams = Pick<
  CreateLiveData,
  'paymentId' | 'clientId' | 'start' | 'expiry'
>

type CreateLiveCoverPhotoUploadParams = { liveId: string; file: CreateLiveData['coverPhoto'] }
type UploadPreviewVideoParams = CreateLiveCoverPhotoUploadParams

export class MedaiService {
  private static _uploadPreviewVideo = async (
    { liveId, file }: UploadPreviewVideoParams,
    session: ClientSession,
  ) => {
    const upload = await MediaManagement.uploadAndTransacodeVideo({
      file,
      waitTranscode: true,
      waitDuration: 20,
      expire: undefined,
    })

    const videoUploadDoc = await new VideoUploadModel({
      bucket: upload.Bucket,
      key: upload.Key,
      mimetype: upload.mimetype,
      size: upload.size,
      isTranscoded: upload.isTranscoded,
      parentId: liveId,
      parentType: 'live',
    }).save({ session })

    return videoUploadDoc
  }

  private static _uploadCreateLiveCoverPhoto = async (
    { liveId, file }: CreateLiveCoverPhotoUploadParams,
    session: ClientSession,
  ) => {
    const upload = await MediaManagement.store({ expire: undefined, baseDir: 'images', file })

    const coverPhoto = await new PosterImageModel({
      video_id: liveId,
      bucket: upload.Bucket,
      key: upload.Key,
      parentType: 'live',
    }).save({ session })

    return coverPhoto
  }

  private static _processCreateLivePaymentPayment = async (
    { paymentId, clientId, start, expiry }: ProcessCreateLivePaymentParams,
    session: ClientSession,
  ) => {
    if (!paymentId) {
      throw new OperationalError('PaymentId is required', 403)
    }

    const confirmPayment = await PaymentModel.findOne({
      _id: paymentId,
      user_id: clientId,
      status: 'success',
      is_used: false,
    })

    if (!confirmPayment) {
      throw new OperationalError('your payment is invalid', 400)
    }

    if (confirmPayment.amount !== calcLiveCharges(start, expiry)) {
      throw new OperationalError('payment made does not match charges', 400)
    }

    const updatedPayment = await PaymentModel.findByIdAndUpdate(
      confirmPayment._id,
      {
        is_used: true,
        use_case: 'live schedule',
      },
      { session },
    )

    if (updatedPayment == null) {
      throw new OperationalError('could not update payment', 500)
    }
  }

  private static _createLiveSession = async (data: CreateLiveData, session: ClientSession) => {
    const vclient_id = await UserRepo.getClientByRolesAndId(data.clientId, [
      'channel',
      'event',
      'podcast',
      'tvshow',
    ])

    if (!vclient_id) {
      throw new OperationalError('assigned user not found', 400)
    }

    if (data.creatorType === 'client') {
      await this._processCreateLivePaymentPayment(
        {
          paymentId: data.paymentId,
          clientId: data.clientId,
          start: data.start,
          expiry: data.expiry,
        },
        session,
      )
    }

    const [streamOngoing, scheduledStream] = await Promise.all([
      LiveModel.findOne({ client_id: data.clientId, active: true }),
      LiveModel.findOne({ client_id: data.clientId, active: false, expired: false }),
    ])

    if (streamOngoing) {
      throw new OperationalError('client has an ongoing stream', 400)
    }

    if (scheduledStream) {
      throw new OperationalError('client has a scheduled stream', 400)
    }

    const live = new LiveModel({
      client_id: vclient_id._id,
      title: data.title,
      stream_key: await getUniqueStreamKey(),
      vid_class: data.vidClass,
      pg: data.pg,
      description: data.description,
      type: data.type,
      start: new Date(data.start),
      expiry: new Date(data.expiry),
      sponsored: data.sponsored,
      popular: data.popular,
      location: data.location,
      payment_id: data.paymentId,
    })

    const liveId = live._id.toString()

    const coverPhoto = await this._uploadCreateLiveCoverPhoto(
      { liveId, file: data.coverPhoto },
      session,
    )

    live.coverPhoto = coverPhoto._id

    if (data.previewVideo) {
      const vidUploadDoc = await this._uploadPreviewVideo(
        { liveId, file: data.previewVideo },
        session,
      )

      live.previewVideoUpload = vidUploadDoc._id
    }

    await live.save({ session })
    return live
  }

  static createLive = async (data: CreateLiveData) => {
    return await withMongoDBSession(this._createLiveSession, data)
  }

  static getVodStream = async (vidUploadId: string, currentUser: LoggedInUser) => {
    const vidUpload = await VideoUploadModel.findById(vidUploadId)

    if (vidUpload == null) {
      throw new OperationalError('Invalid video Upload Id', 404)
    }

    const response = {
      isTranscodedStream: vidUpload.isTranscoded,
      streamUrl: '',
    }

    if (!vidUpload.isTranscoded) {
      response.streamUrl = MediaAccess.getCloudFrontSignedUrl(vidUpload.key)
      return response
    }

    const [recentSetting] = await SettingsModel.find({ user_id: currentUser._id }).sort({
      createdAt: -1,
    })

    const vidQuality =
      recentSetting && recentSetting.video_quality ? recentSetting.video_quality : '720p'

    const vidUploadRes = vidUpload.resolutions.find(r => r.key.endsWith(`${vidQuality}.mp4`))

    if (vidUploadRes == null) {
      throw new OperationalError('something went wrong', 500)
    }

    response.streamUrl = MediaAccess.getCloudFrontSignedUrl(vidUploadRes.key)
    return response
  }

  static getPhotoUrl = async (bucket: string, key: string) => {
    return await MediaAccess.getSignedUrl(bucket, key, 'photo')
  }

  static getSubtitleUrl = async (bucket: string, key: string) => {
    return await MediaAccess.getSignedUrl(bucket, key, 'subtitle')
  }
}
