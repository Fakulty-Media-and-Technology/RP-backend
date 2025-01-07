import env from '../../env'

import { Live, LiveModel } from '../../models/lives.model'
import { PaymentModel } from '../../models/payments.model'
import { LiveRepo } from '../../repositories/LiveRepo'
import { UserRepo } from '../../repositories/UserRepo'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { ClientSession } from 'mongoose'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { calcLiveCharges, signCred, getUniqueStreamKey } from '../../utils/live'

type CreateClientWithSessionInput = {
  currentUser: LoggedInUser
  data: Record<string, any>
}

type ExtendLiveEventWithSessionInput = CreateClientWithSessionInput

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

    const streamOngoing = await LiveRepo.getActiveById(client_id)

    if (streamOngoing) {
      throw new OperationalError('client have an ongoing stream', 400)
    }

    const scheduledStream = await LiveModel.find({
      _id: client_id,
      active: false,
      expired: true,
    })

    if (scheduledStream.length > 0) {
      throw new OperationalError('client alrealy has a pending scheduled stream', 400)
    }

    await new LiveModel({
      client_id: vclient_id._id,
      title: title,
      sub_title: sub_title,
      stream_key: await getUniqueStreamKey(),
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

    type StreamCredential = Live & {
      stream_server: string
      stream_url: string
    }

    const credentials = await LiveModel.aggregate([
      {
        $match: {
          client_id: currentUser._id,
          expired: false,
        },
      },
      {
        $addFields: {
          stream_server: env.RP_RTMP_URL,
          stream_url: {
            $concat: [env.RP_HLS_URL, '$stream_key', '/index.m3u8'],
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      { $project: { __v: false } },
    ])

    const modifiedCredentials = (credentials as StreamCredential[]).map(cred => {
      const signed = `?sign=${signCred(cred.stream_key || '', cred.expiry)}`
      cred.stream_key = cred.stream_key + signed
      cred.stream_url = cred.stream_url + signed
      return cred
    })

    return modifiedCredentials
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
