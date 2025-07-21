import { RatingModel } from '../models/rating.model'

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
                  boundaries: [0, 1, 2, 3, 4, 5],
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

    return res
  }
}


