import crypto from 'node:crypto'
import env from '../../env'
import { LiveModel } from '../../models/lives.model'
import { PaymentModel } from '../../models/payments.model'
import { LiveRepo } from '../../repositories/LiveRepo'
import { UserRepo } from '../../repositories/UserRepo'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { ClientSession } from 'mongoose'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'

type CreateClientWithSessionInput = {
  currentUser: LoggedInUser
  data: Record<string, any>
}

type ExtendLiveEventWithSessionInput = CreateClientWithSessionInput

const calcLiveCharges = (start: string, expiry: string) => {
  const startDate = new Date(start).getTime()
  const expiryDate = new Date(expiry).getTime()
  const hoursDifference = (expiryDate - startDate) / (60 * 60000)
  return hoursDifference * env.EVENT_HOURLY_CHARGES
}

const genRandUniqId = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charsLength = chars.length

  const randomBytes = crypto.randomBytes(length)
  let result = ''

  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % charsLength]
  }

  return result
}

export class LiveStreamService {
  private static _createClientWithSession = async (
    { data, currentUser }: CreateClientWithSessionInput,
    session: ClientSession,
  ) => {
    const { id: client_id } = currentUser

    const {
      title,
      sub_title,
      cover_photo,
      vid_class,
      pg,
      category,
      description,
      type,
      start,
      expiry,
      sponsored,
      popular,
      video,
      location,
      payment_id,
    } = data

    if (
      !title ||
      !sub_title ||
      !cover_photo ||
      !vid_class ||
      !pg ||
      !category ||
      !description ||
      !type ||
      !sponsored ||
      !popular ||
      !start ||
      !payment_id ||
      !location
    ) {
      throw new OperationalError('all important fields are required', 400)
    }

    const vclient_id = await UserRepo.getClientByRolesAndId(client_id, [
      'channel',
      'event',
      'podcast',
      'tvshow',
    ])

    if (!vclient_id) {
      throw new OperationalError('assigned user not found', 400)
    }

    const confirmPayment = await PaymentModel.findOne({
      _id: payment_id,
      user_id: vclient_id._id,
      status: 'success',
      is_used: false,
    })

    if (!confirmPayment) {
      throw new OperationalError('your payment is invalid', 400)
    }

    if (confirmPayment.amount !== calcLiveCharges(start, expiry)) {
      throw new OperationalError('payment made does not match charges', 400)
    }

    const streamId = genRandUniqId(12)

    const streamIdExist = await LiveModel.findOne({
      stream_key: streamId,
    })

    if (streamIdExist) {
      throw new OperationalError('Please try again', 400)
    }

    const streamOngoing = await LiveRepo.getActiveById(client_id)

    if (streamOngoing !== null) {
      throw new OperationalError('client have an ongoing stream', 400)
    }

    const scheduledStream = await LiveModel.find({
      _id: client_id,
      active: false,
      expired: true,
    })

    if (scheduledStream.length > 0) {
      throw new OperationalError('client alrealdy have pending scheduled stream', 400)
    }

    // TODO: Use Session

    await new LiveModel({
      client_id: vclient_id._id,
      title: title,
      sub_title: sub_title,
      stream_key: streamId,
      cover_photo: cover_photo,
      vid_class: vid_class,
      pg: pg,
      category: category,
      description: description,
      type: type,
      start: new Date(start),
      expiry: new Date(expiry),
      sponsored,
      popular,
      location,
      preview_video: video,
      payment_id: confirmPayment._id,
    }).save({ session })

    // TODO: error handling
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

    if (confirmPayment.amount !== calcLiveCharges(liveEvent.expiry.toISOString(), new_expiry)) {
      throw new OperationalError('payment made does not match charges', 400)
    }

    const streamId = genRandUniqId(12)

    const streamIdExist = await LiveModel.findOne({
      stream_key: streamId,
    })

    if (streamIdExist) {
      throw new OperationalError('Oops, please try again', 400)
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

  static calcEventCharges = (start: unknown, expiry: unknown) => {
    if (typeof start !== 'string' || typeof expiry !== 'string') {
      throw new OperationalError('start and expirey must be strings', 400)
    }

    return {
      estimated_cost: calcLiveCharges(start, expiry),
    }
  }

  static getLiveStreamCredentials = async (currentUser: LoggedInUser) => {
    const rtmpUrl = `${env.RP_RTMPURL}` //?email=''&&password=''

    const credentials = await LiveModel.aggregate([
      {
        $match: {
          client_id: currentUser._id,
          expired: false,
        },
      },
      {
        $addFields: {
          stream_server: rtmpUrl,
        },
      },
      {
        $addFields: {
          stream_url: {
            $concat: [env.RP_HLSURL, '$stream_key', '/index.m3u8'],
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ])

    return credentials
  }

  static createClient = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    await withMongoDBSession(this._createClientWithSession, {
      currentUser,
      data,
    })
  }

  static extendLiveEvent = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    await withMongoDBSession(this._extendLiveEventWithSession, {
      data,
      currentUser,
    })
  }
}
