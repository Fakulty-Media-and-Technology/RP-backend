import { Aggregate } from 'mongoose'
import { RatingModel } from '../models/rating.model'

interface ParentRatingsStatsResponse {
  totalStats: TotalStat[]
  groupStats: GroupStat[]
}

interface GroupStat {
  count: number
  rate: number
}

interface TotalStat {
  totalRatingsDocuments: number
  averageRating: number
}

export class RatingsRepo {
  static parentRatingsStats = (parentId: string) => {
    const res = RatingModel.aggregate(
      [
        { $match: { $expr: { $eq: ['$parentId', { $toObjectId: parentId }] } } },
        {
          $facet: {
            totalStats: [
              {
                $group: {
                  _id: null,
                  totalRatingsDocuments: { $sum: 1 },
                  averageRating: { $avg: '$rate' },
                },
              },

              { $unset: '_id' },
            ],
            groupStats: [
              {
                $bucket: {
                  groupBy: '$rate',
                  boundaries: [0, 1, 2, 3, 4, 5, 6],
                  default: 'other',
                },
              },

              { $set: { rate: '$_id', _id: '$$REMOVE' } },
            ],
          },
        },
      ],
      {
        allowDiskUse: true,
      },
    )

    return res as Aggregate<ParentRatingsStatsResponse[]>
  }
}
