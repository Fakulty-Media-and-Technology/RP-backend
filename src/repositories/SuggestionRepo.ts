import env from '../env'
import { SuggestionModel } from '../models/suggestions.model'

export class SuggestionRepo {
  static adminAllSuggestions = (skip: number, limit: number) =>
    SuggestionModel.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',

          pipeline: [
            {
              $project: {
                first_name: 1,
                last_name: 1,
                photo: {
                  $cond: {
                    if: { $eq: [{ $ifNull: ['$photo', null] }, null] },
                    then: null,
                    else: { $concat: [env.CDN_IMAGES_BASE_URL, '/', '$photo.Key'] },
                  },
                },
                email: 1,
                country_code: 1,
                mobile: 1,
              },
            },
          ],
        },
      },

      {
        $sort: {
          _id: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ])
}
