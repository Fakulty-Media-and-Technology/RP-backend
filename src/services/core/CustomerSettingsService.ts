import { FilterQuery, UpdateQuery } from 'mongoose'
import { SettingsModel, SettingsSchema } from '../../models/userSettings.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { denyGuestUser } from '../../utils/denyGuestUser'
import { UserModel } from '../../models/users.model'

type PushPull = 'pull' | 'push'

export class CustomerSettingsService {
  static pushInterest = async (currentUser: LoggedInUser, interest: string) => {
    if ((currentUser.role as string) === 'guest') {
      throw new OperationalError('you are not authenticated', 403)
    }

    await SettingsModel.findOneAndUpdate(
      {
        user_id: currentUser._id,
      },
      {
        $set: { interest },
      },
      {
        upsert: true,
      },
    )
  }

  static pushPullFromWatchlist = async (
    currentUser: LoggedInUser,
    videoId: string,
    type: PushPull,
  ) => {
    const change = { watchlist: videoId }

    const filter: FilterQuery<SettingsSchema> = {
      user_id: currentUser._id,
    }

    const changes: UpdateQuery<SettingsSchema> = {}

    if (type === 'pull') {
      changes.$pull = change
      filter.watchlist = videoId
    } else {
      changes.$push = change
    }

    await SettingsModel.findOneAndUpdate(filter, changes, {
      new: true,
    })
  }

  protected static _setSettingsSession = async (
    {
      currentUser,
      data,
    }: {
      currentUser: LoggedInUser
      data: Record<string, any>
    },
    session: MaybeSession,
  ) => {
    const {
      video_quality,
      allow_notifications,
      new_services,
      upcoming_events,
      new_arrivals,
      live_channels,
    } = data

    const settingsDocument = await SettingsModel.findOneAndUpdate(
      {
        user_id: currentUser.id,
      },
      {
        video_quality: video_quality,
        allow_notifications: allow_notifications,
        new_services: new_services,
        upcoming_events: upcoming_events,
        new_arrivals: new_arrivals,
        live_channels: live_channels,
      },
      {
        upsert: true,
        session,
      },
    )

    if (video_quality && settingsDocument != null) {
      await UserModel.findByIdAndUpdate(currentUser._id, { $set: { videoQuality: video_quality } })
    }
  }

  static setNotificationSettings = async (currentUser: LoggedInUser, data: Record<string, any>) => {
    denyGuestUser(currentUser)

    await withMongoDBSession(this._setSettingsSession, {
      currentUser,
      data,
    })
  }
}
