import { LiveModel, Live } from '../../models/lives.model'
import { PaymentModel } from '../../models/payments.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { calcLiveCharges, signCred, getUniqueStreamKey } from '../../utils/live'
import { LiveRepo } from '../../repositories/LiveRepo'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'
import { throwReasonIfAny } from '../../utils/promises'
import { ValidCurrency } from '../../utils/currency'
// import { PosterImageModel } from '../../models/poster.model'
import { UserRepo } from '../../repositories/UserRepo'
import { Purge } from '../../utils/Purge'
import { MediaManagement } from '../media-management'
import { UploadMediaUtils } from '../../utils/UploadMediaUtils'
import { UserDocument } from '../../models/users.model'
import { ClientSession } from 'mongoose'
import { ViewModel } from '../../models/view.model'
import { CommentModel } from '../../models/comments.model'
import { QueryParamsFeatures, ExpressRequestQuery } from '../../utils/QueryParamsFeatures'

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
  creatorType: 'admin' | 'client'
  amount?: number
  currency?: string
}

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

// RENAME
type HandleSocketNewComment = {
  userDocument: UserDocument
  liveId: string
  message: string
}

type HandleNewmemberInput = {
  userDocument: UserDocument
  liveId: string
  membership: 'JOIN' | 'LEAVE'
}

export class LiveStreamService {
  static handleSocketComment = async (
    { message, liveId, userDocument }: HandleSocketNewComment,
    session?: ClientSession,
  ) => {
    if (message.toString().length < 1) {
      throw new OperationalError('A comment must have at least one character', 400)
    }

    const liveDocument = await LiveModel.findOne({
      _id: liveId,
      active: true,
    })

    if (!liveDocument) {
      throw new OperationalError('invalid live Id', 404)
    }

    const commentDocument = await new CommentModel({
      userId: userDocument._id,
      message: message,
      parentType: 'live',
      parentId: liveId,
    }).save({ session })

    ++liveDocument.commentsCount
    await liveDocument.computeEngagements(session)
    return commentDocument
  }

  static handleSocketMembership = async (
    { userDocument, liveId, membership }: HandleNewmemberInput,
    session?: ClientSession,
  ) => {
    const liveDocument = await LiveModel.findById(liveId)

    if (liveDocument == null) {
      throw new OperationalError('Invalid event Id', 404)
    }

    switch (membership) {
      case 'JOIN':
        if (liveDocument.active == false) {
          throw new OperationalError('Live is Inactive', 400)
        }

        // User may have viewed the content before joining
        try {
          await new ViewModel({
            viewer: userDocument._id,
            content: liveId,
            contentType: 'live',
          }).save({ session })

          ++liveDocument.viewsCount
        } catch {}

        ++liveDocument.active_views
        await liveDocument.computeEngagements(session)
        break

      case 'LEAVE':
        const deletedViewDocument = await ViewModel.findOneAndDelete(
          {
            viewer: userDocument._id,
            content: liveId,
            contentType: 'live',
          },
          { session },
        )

        if (deletedViewDocument) return

        --liveDocument.viewsCount
        --liveDocument.active_views
        await liveDocument.computeEngagements(session)
        break

      default:
        console.error(
          'Unkown membership for livestream socket session',
          liveId,
          'Membership',
          membership,
        )
        break
    }
  }

  private static _extendLiveEventWithSession = async (
    { currentUser, data }: ExtendLiveEventWithSessionInput,
    session: MaybeSession,
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

  // ************** Public ************

  static searchByText = async (text: string) =>
    await LiveRepo.searchLivesByTextReg(new RegExp(text, 'i'))

  static getFeatured = async () => await LiveRepo.getFeatured()

  static addFeatured = async (id: string, expiry: string) => await LiveRepo.addFeatured(id, expiry)

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

  static getLiveStreamCredentials = async (
    currentUser: LoggedInUser,
    query: ExpressRequestQuery,
  ) => {
    const { page, limit } = QueryParamsFeatures.paginagteParams(query)

    const liveResults = await LiveRepo.getValidClientLive(currentUser._id, page, limit)
    const quality = currentUser.videoQuality ?? '720p'

    const lives = await LiveMediaSourcesUtils.resolveSources(liveResults, quality, true)
    return lives
  }

  static extendLiveEvent = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    await withMongoDBSession(this._extendLiveEventWithSession, {
      data,
      currentUser,
    })
  }

  private static _deleteLiveSession = async (
    { currentUser, liveId }: DeleteLiveInput,
    session: MaybeSession,
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

  private static _checkLiveOngoinStreams = async (data: CreateLiveData) => {
    const liveDocument = await LiveModel.exists({
      client_id: data.clientId,
      expiry: { $lt: new Date() },
    }).select('_id')

    if (liveDocument) {
      throw new OperationalError('Previous live event must expire', 403)
    }
  }

  protected static _editLiveMedia = async (
    { previewVideoFile, coverPhotoFile, liveId }: EditLiveInput,
    session: MaybeSession,
  ) => {
    if (previewVideoFile == null && coverPhotoFile == null) {
      throw new OperationalError('upload at least one file', 400)
    }

    const liveDocument = await LiveModel.findById(liveId)

    if (liveDocument == null) {
      throw new OperationalError('invalid live id', 404)
    }

    if (coverPhotoFile) {
      const photoUpload = await MediaManagement.storeImageAndSubtitle(
        coverPhotoFile,
        liveDocument.expiry,
      )

      if (liveDocument.coverPhoto) {
        MediaManagement.deleteObject(liveDocument.coverPhoto.Key, liveDocument.coverPhoto.Bucket)
      }

      liveDocument.coverPhoto = {
        Key: photoUpload.Key,
        Bucket: photoUpload.Bucket,
      }
    }

    if (previewVideoFile) {
      const vidUpload = await MediaManagement.uploadAndInitiateMediaConvert(
        previewVideoFile,
        liveDocument.expiry,
      )

      if (liveDocument.previewVideoUpload) {
        Purge.videoUploadById(liveDocument.previewVideoUpload)
      }

      const videoUploadDocument = UploadMediaUtils.getVideoUploadDocument(vidUpload)
      videoUploadDocument.parentId = liveDocument._id
      videoUploadDocument.parentType = 'live'
      liveDocument.previewVideoUpload = videoUploadDocument._id
      liveDocument.isPreviewVideoReady = false
      await videoUploadDocument.save({ session })
    }

    await liveDocument.save({ session })
  }

  static editLiveMedia = async (data: EditLiveInput) => {
    await withMongoDBSession(this._editLiveMedia, data)
  }

  static updateLiveActiveState = async ({ liveId, active }: UpdateLiveActiveStateInput) => {
    const live = await LiveModel.findByIdAndUpdate(liveId, { $set: { active } })

    if (live == null) {
      throw new OperationalError('invalid live id', 404)
    }
  }

  private static _createLiveSession = async (data: CreateLiveData, session: MaybeSession) => {
    await this._checkLiveOngoinStreams(data)

    const liveDocument = new LiveModel({
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
      amount: data.amount,
      currency: data.currency,
    })

    if (data.coverPhoto) {
      const photoUpload = await MediaManagement.storeImageAndSubtitle(
        data.coverPhoto,
        liveDocument.expiry,
      )

      liveDocument.coverPhoto = {
        Key: photoUpload.Key,
        Bucket: photoUpload.Bucket,
      }
    }

    if (data.previewVideo) {
      const vidUpload = await MediaManagement.uploadAndInitiateMediaConvert(
        data.previewVideo,
        liveDocument.expiry,
      )

      const videoUploadDocument = UploadMediaUtils.getVideoUploadDocument(vidUpload)
      videoUploadDocument.parentId = liveDocument._id
      videoUploadDocument.parentType = 'live'
      liveDocument.previewVideoUpload = videoUploadDocument._id
      liveDocument.isPreviewVideoReady = false
      await videoUploadDocument.save({ session })
    }

    await liveDocument.save({ session })

    return {
      liveId: liveDocument._id.toString(),
    }
  }

  static createLive = async (data: CreateLiveData) => {
    return await withMongoDBSession(this._createLiveSession, data)
  }
}
