import env from '../../env'

import { LiveModel, Live } from '../../models/lives.model'
import { PaymentModel } from '../../models/payments.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { ClientSession } from 'mongoose'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { calcLiveCharges, signCred, getUniqueStreamKey } from '../../utils/live'
import { LiveRepo } from '../../repositories/LiveRepo'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'
import { getPromiseAllFulfilledResults, throwReasonIfAny } from '../../utils/promises'
import { ValidCurrency } from '../../utils/currency'
import { PosterImageModel } from '../../models/poster.model'
import { VideoUploadModel } from '../../models/videoupload.model'
import { UserRepo } from '../../repositories/UserRepo'
import { MongoDBObjectId } from '../../types/general'
import { Purge } from '../../utils/Purge'
import { MediaManagement } from '../media-management'

export type CreateLiveData = {
  clientId: string
  title: string
  subTitle?: string
  pg: string
  vidClass: string
  type: string
  start: string
  expiry: string
  category?: string[]
  description?: string
  location?: string
  upcoming?: boolean
  coverPhoto: Express.Multer.File
  previewVideo?: Express.Multer.File
  sponsored?: boolean
  popular?: boolean
  paymentId: string
  creatorType: 'admin' | 'client'
}

type LiveFileUploader = (
  params: { data: CreateLiveData; live: Live },
  session: ClientSession,
) => Promise<void>

type CreateClientWithSessionInput = {
  currentUser: LoggedInUser
  data: Record<string, any>
}

type DeleteLiveInput = {
  currentUser: LoggedInUser
  liveId: string
}

type EditLiveInput = {
  previewVideoFile?: Express.Multer.File
  coverPhotoFile?: Express.Multer.File
  liveId: string
}

type UpdateLiveActiveStateInput = {
  liveId: string
  active: boolean
}

type ExtendLiveEventWithSessionInput = CreateClientWithSessionInput

export class LiveStreamService {
  private static _extendLiveEventWithSession = async (
    { currentUser, data }: ExtendLiveEventWithSessionInput,
    session: ClientSession,
  ) => {
    const { id: client_id } = currentUser
    const { live_id, new_expiry, payment_id } = data

    if (!payment_id || !new_expiry || !live_id) {
      throw new OperationalError('all important fields are required', 400)
    }

    const confirmPayment = await PaymentModel.findOne({
      _id: payment_id,
      user_id: client_id,
      status: 'success',
      is_used: false,
    })

    if (!confirmPayment) {
      throw new OperationalError('your payment is invalid', 400)
    }

    const liveEvent = await LiveModel.findOne({
      _id: live_id,
      client_id: client_id,
      active: true,
    })

    if (!liveEvent) {
      throw new OperationalError('event not found or not active', 400)
    }

    if (liveEvent.expiry == null) {
      throw new OperationalError('live event has no expiry', 400)
    }

    const charges = calcLiveCharges({
      start: liveEvent.expiry.toISOString(),
      expiry: new_expiry,
      currency: confirmPayment.currency,
    })

    if (confirmPayment.amount !== charges) {
      throw new OperationalError('payment made does not match charges', 400)
    }

    await LiveModel.findOneAndUpdate(
      {
        _id: live_id,
        client_id: client_id,
      },
      {
        expiry: new Date(new_expiry),
        extpayment_id: confirmPayment._id,
      },
      { session },
    )

    await PaymentModel.findOneAndUpdate(
      {
        _id: confirmPayment._id,
      },
      {
        is_used: true,
        use_case: 'live schedule ext',
      },
      {
        session,
      },
    )
  }

  // ************** Public ************88

  static calcEventCharges = (start: string, expiry: string, currency: ValidCurrency) => {
    if (typeof start !== 'string' || typeof expiry !== 'string') {
      throw new OperationalError('start and expirey must be strings', 400)
    }

    const charges = calcLiveCharges({
      start,
      expiry,
      currency,
    })

    return { estimated_cost: charges }
  }

  static getLiveStreamCredentials = async (currentUser: LoggedInUser) => {
    const [vidQualitySettled, liveSettled] = await Promise.allSettled([
      VidUploadUtils.getUserVideoQuality(currentUser._id.toString(), '720p'),
      LiveRepo.getValidClientLive(currentUser._id.toString()),
    ])

    if (vidQualitySettled.status === 'rejected') {
      throw vidQualitySettled.reason
    }

    if (liveSettled.status === 'rejected') {
      throw liveSettled.reason
    }

    const vidQuality = vidQualitySettled.value
    const liveAggrRes = liveSettled.value

    const lives = await LiveMediaSourcesUtils.resolveSources(liveAggrRes, vidQuality)

    const creds = await Promise.allSettled(
      lives.map(async live => {
        const { streamKey } = live
        const signed = `?sign=${signCred(streamKey, live.expiry)}`

        Object.assign(live, {
          stream_server: env.RP_RTMP_URL,
          stream_url: env.RP_HLS_URL + streamKey + '/index.m3u8' + signed,
          stream_key: streamKey + signed,
        })

        return live
      }),
    )

    return getPromiseAllFulfilledResults(creds)
  }

  static extendLiveEvent = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    await withMongoDBSession(this._extendLiveEventWithSession, {
      data,
      currentUser,
    })
  }

  private static _deleteLiveSession = async (
    { currentUser, liveId }: DeleteLiveInput,
    session: ClientSession,
  ) => {
    const isAdmin = ['admin', 'superadmin'].includes(currentUser.role)
    const isClient = ['channel', 'tvshow', 'event', 'podcast'].includes(currentUser.role)

    if (!isAdmin && !isClient) {
      throw new OperationalError('only admins or a client can delete live', 403)
    }

    const deletedLive = await LiveModel.findByIdAndDelete(liveId, { session })

    if (deletedLive == null) {
      throw new OperationalError('invalid liveId', 404)
    }

    if (isClient && deletedLive.client_id.toString() !== currentUser._id.toString()) {
      throw new OperationalError('You do not own this live', 403)
    }

    Purge.live(deletedLive)
  }

  static deleteLive = async (input: DeleteLiveInput) => {
    await withMongoDBSession(this._deleteLiveSession, input)
  }

  private static _uploadLivePreviewVideo: LiveFileUploader = async ({ data, live }, session) => {
    if (!data.previewVideo) return

    const upload = await MediaManagement.uploadAndInitiateMediaConvert({
      file: data.previewVideo,
      expire: undefined,
    })

    const videoUploadDoc = await new VideoUploadModel({
      bucket: upload.Bucket,
      key: upload.Key,
      mimetype: upload.mimetype,
      size: upload.size,
      isTranscoded: upload.isTranscoded,
      parentId: live._id,
      parentType: 'live',
    }).save({ session })

    live.previewVideoUpload = videoUploadDoc._id
  }

  private static _uploadLiveCoverPhoto: LiveFileUploader = async ({ data, live }, session) => {
    if (!data.coverPhoto) {
      throw new OperationalError('cover photo is required', 400)
    }
    const upload = await MediaManagement.store({
      expire: undefined,
      baseDir: 'images',
      file: data.coverPhoto,
    })

    const coverPhoto = await new PosterImageModel({
      video_id: live._id,
      bucket: upload.Bucket,
      key: upload.Key,
      parentType: 'live',
    }).save({ session })

    live.coverPhoto = coverPhoto._id
  }

  private static _checkLiveOngoinStreams = async (data: CreateLiveData) => {
    const live = await LiveModel.findOne({
      client_id: data.clientId,
      expiry: { $lte: new Date() },
    })

    if (live) {
      throw new OperationalError('all previous live must first expire', 403)
    }
  }

  private static _checkLivePayments = async (data: CreateLiveData, session: ClientSession) => {
    const confirmPayment = await PaymentModel.findOne({
      _id: data.paymentId,
      user_id: data.clientId,
      status: 'success',
      is_used: false,
    })

    if (!confirmPayment) {
      throw new OperationalError('your payment is invalid', 400)
    }

    const charges = calcLiveCharges({
      start: data.start,
      expiry: data.expiry,
      currency: confirmPayment.currency,
    })

    if (confirmPayment.amount !== charges) {
      throw new OperationalError('amount must be the same as charge', 400)
    }

    await PaymentModel.findByIdAndUpdate(
      confirmPayment._id,
      {
        is_used: true,
        use_case: 'live schedule',
      },
      { session },
    )
  }

  private static _checkLiveClient = async (data: CreateLiveData) => {
    const vclient_id = await UserRepo.getClientByRolesAndId(data.clientId, [
      'channel',
      'event',
      'podcast',
      'tvshow',
    ])

    if (!vclient_id) {
      throw new OperationalError('assigned user not found', 400)
    }
  }

  private static _createLiveSession = async (data: CreateLiveData, session: ClientSession) => {
    const settled = await Promise.allSettled([
      this._checkLiveClient(data),
      this._checkLiveOngoinStreams(data),
    ])

    throwReasonIfAny(settled)

    await this._checkLivePayments(data, session)

    const live = new LiveModel({
      client_id: data.clientId,
      title: data.title,
      subTitle: data.subTitle,
      stream_key: await getUniqueStreamKey(),
      vid_class: data.vidClass,
      pg: data.pg,
      description: data.description,
      category: data.category || [],
      type: data.type,
      upcoming: data.upcoming,
      start: new Date(data.start),
      expiry: new Date(data.expiry),
      sponsored: data.sponsored,
      popular: data.popular,
      location: data.location,
      payment_id: data.paymentId,
    })

    const uploaderParams = { data, live }

    await this._uploadLivePreviewVideo(uploaderParams, session)
    await this._uploadLiveCoverPhoto(uploaderParams, session)
    await live.save({ session })
  }

  protected static _editLiveMedia = async (
    { previewVideoFile, coverPhotoFile, liveId }: EditLiveInput,
    session: ClientSession,
  ) => {
    if (previewVideoFile == null && coverPhotoFile == null) {
      throw new OperationalError('upload at least one file', 400)
    }

    let prevCoverPhotoId: MongoDBObjectId | null = null
    let prevPreviewVideoId: MongoDBObjectId | null = null

    const live = await LiveModel.findById(liveId)

    if (live == null) {
      throw new OperationalError('invalid live id', 404)
    }

    if (coverPhotoFile) {
      const photoUpload = await MediaManagement.store({
        file: coverPhotoFile,
        expire: undefined,
        baseDir: 'images',
      })

      prevCoverPhotoId = live.coverPhoto

      const coverPhototDocument = await new PosterImageModel({
        video_id: live._id,
        bucket: photoUpload.Bucket,
        key: photoUpload.Key,
        dimension: 'channel-logo',
        parentType: 'live',
      }).save({ session })

      live.coverPhoto = coverPhototDocument._id
    }

    if (previewVideoFile) {
      const vidUpload = await MediaManagement.uploadAndInitiateMediaConvert({
        file: previewVideoFile,
        expire: undefined,
      })

      prevPreviewVideoId = live.previewVideoUpload

      const videoUploadDocument = await new VideoUploadModel({
        bucket: vidUpload.Bucket,
        key: vidUpload.Key,
        mimetype: vidUpload.mimetype,
        size: vidUpload.size,
        isTranscoded: vidUpload.isTranscoded,
        parentId: live._id,
        parentType: 'live',
      }).save({ session })

      live.previewVideoUpload = videoUploadDocument._id
    }

    await live.save({ session })

    return {
      prevCoverPhotoId,
      prevPreviewVideoId,
    }
  }

  static editLiveMedia = async (data: EditLiveInput) => {
    const { prevCoverPhotoId, prevPreviewVideoId } = await withMongoDBSession(
      this._editLiveMedia,
      data,
    )

    if (prevCoverPhotoId) Purge.posterById(prevCoverPhotoId)
    if (prevPreviewVideoId) Purge.videoUploadById(prevPreviewVideoId)
  }

  static updateLiveActiveState = async ({ liveId, active }: UpdateLiveActiveStateInput) => {
    const live = await LiveModel.findByIdAndUpdate(liveId, { $set: { active } })

    if (live == null) {
      throw new OperationalError('invalid live id', 404)
    }
  }

  static createLive = async (data: CreateLiveData) => {
    return await withMongoDBSession(this._createLiveSession, data)
  }
}
