import env from '../../env'

import { LiveModel } from '../../models/lives.model'
import { PaymentModel } from '../../models/payments.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { ClientSession } from 'mongoose'
import { withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { calcLiveCharges, signCred } from '../../utils/live'
import { LiveRepo } from '../../repositories/LiveRepo'
import { LiveMediaSourcesUtils } from '../../utils/LiveMediaSourcesUtils'
import { VidUploadUtils } from '../../utils/VideoUploadUtils'

type CreateClientWithSessionInput = {
  currentUser: LoggedInUser
  data: Record<string, any>
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
    const vidQuality = await VidUploadUtils.getUserVideoQuality(currentUser._id.toString(), '720p')

    const lives = await LiveMediaSourcesUtils.resolveSources(
      await LiveRepo.getValidClientLive(currentUser._id.toString()),
      vidQuality,
    )

    return await Promise.all(
      lives.map(async live => {
        const signed = `?sign=${signCred(live.stream_key || '', live.expiry)}`

        Object.assign(live, {
          stream_server: env.RP_RTMP_URL,
          stream_url: env.RP_HLS_URL + live.stream_key + '/index.m3u8' + signed,
          stream_key: live.stream_key + signed,
        })

        return live
      }),
    )
  }

  static extendLiveEvent = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    await withMongoDBSession(this._extendLiveEventWithSession, {
      data,
      currentUser,
    })
  }
}
