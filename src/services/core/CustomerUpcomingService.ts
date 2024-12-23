import { MediaAccess } from '../../../src/services/media-access'
import { UpcomingModel } from '../../models/upcoming.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'

export class CustomerUpcomingService {
  static fetchUpcoming = async () => {
    const comingSoon = await UpcomingModel.aggregate([
      {
        $match: {
          active: true,
        },
      },
      {
        $lookup: {
          from: 'trailers',
          let: {
            tid: '$trailer_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    '$_id',
                    {
                      $toObjectId: '$$tid',
                    },
                  ],
                },
              },
            },
            {
              $project: {
                __v: 0,
              },
            },
          ],
          as: 'trailer',
        },
      },
      {
        $addFields: {
          trailer: { $arrayElemAt: ['$trailer', 0] },
        },
      },
    ])

    return await Promise.all(
      comingSoon.map(async ele => {
        ele.portrait_photo = await MediaAccess.getSignedUrl(
          ele?.portrait_photo?.Bucket,
          ele?.portrait_photo?.Key,
          'photo',
        )

        ele.landscape_photo = await MediaAccess.getSignedUrl(
          ele?.landscape_photo?.Bucket,
          ele?.landscape_photo?.Key,
          'photo',
        )

        return ele
      }),
    )
  }

  static subscribeToUpComing = async (currentUser: LoggedInUser, upcomingId: string) => {
    if ((currentUser.role as string) === 'guest') {
      throw new OperationalError('you are not authenticated', 403)
    }

    const upcoming = await UpcomingModel.findById(upcomingId)

    if (upcoming === null) {
      throw new OperationalError('Upcoming not found', 404)
    }

    if (upcoming.reminder.includes(currentUser.id)) {
      throw new OperationalError('user already subscribed', 400)
    }

    await UpcomingModel.findOneAndUpdate(
      {
        _id: upcomingId,
      },
      {
        $push: {
          reminder: currentUser._id,
        },
      },
      {
        upsert: true,
      },
    )
  }

  static unsubscribeFromUpcoming = async (currentUser: LoggedInUser, upcomingId: string) => {
    if ((currentUser.role as string) === 'guest') {
      throw new OperationalError('you are not authenticated', 403)
    }

    await UpcomingModel.findOneAndUpdate(
      {
        _id: upcomingId,
        reminder: currentUser.id,
      },
      {
        $pull: {
          reminder: currentUser._id,
        },
      },
      {
        // ????
        upsert: true,
      },
    )
  }

  static isSubscribedToUpcoming = async (currentUser: LoggedInUser, upcomingId: string) => {
    const upcoming = await UpcomingModel.findOne({
      _id: upcomingId,
      reminder: currentUser.id,
    })

    return !!upcoming
  }
}
