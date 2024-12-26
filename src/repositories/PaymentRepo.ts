import { PaymentModel } from '../models/payments.model'

export class PaymentRepo {
  static getDeposits = (page: number, limit: number) =>
    PaymentModel.aggregate([
      {
        $match: {},
      },
      {
        $lookup: {
          from: 'users',
          let: {
            uid: '$user_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        '$_id',
                        {
                          $toObjectId: '$$uid',
                        },
                      ],
                    },
                    {
                      $in: ['$role', ['tvshow', 'channel', 'podcast', 'event']],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                role: 1,
              },
            },
          ],
          as: 'client',
        },
      },
      {
        $match: {
          $expr: {
            $ne: ['$client', []],
          },
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ])
}
