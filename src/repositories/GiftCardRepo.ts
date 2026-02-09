import { GiftCardModel } from '../models/giftcard.model'

interface WithNames {
  skip: number
  limit: number
  creatorMode?: unknown
  currency?: unknown
}

export class GiftCardRepo {
  static withNames = ({ skip, limit, creatorMode, currency }: WithNames) =>
    GiftCardModel.aggregate([
      ...(typeof creatorMode === 'string' ? [{ $match: { creatorMode } }] : []),
      ...(typeof currency == 'string' ? [{ $match: { currency } }] : []),

      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: 'users',
          localField: 'admin_id',
          foreignField: '_id',
          as: 'admin',

          pipeline: [
            {
              $project: {
                first_name: true,
                last_name: true,
              },
            },
          ],
        },
      },

      {
        $lookup: {
          from: 'giftcard-merchants',
          localField: 'admin_id',
          foreignField: '_id',
          as: 'merchant',

          pipeline: [
            {
              $project: {
                email: true,
              },
            },
          ],
        },
      },

      {
        $project: {
          amount: true,
          currency: true,
          code: true,
          creatorMode: true,
          status: true,
          createdAt: true,
          updatedAt: true,

          adminId: '$admin_id',
          name: {
            $cond: {
              if: { $eq: ['$creatorMode', 'RP'] },
              then: {
                $concat: [
                  { $ifNull: [{ $first: '$admin.first_name' }, 'NO_FIRST_NAME'] },
                  ' ',
                  { $ifNull: [{ $first: '$admin.last_name' }, 'NO_LAST_NAME'] },
                ],
              },
              else: { $ifNull: [{ $first: '$merchant.email' }, 'Unknown Merchant'] },
            },
          },

          serialNumber: {
            $concat: [
              'SN',
              {
                $toString: '$serialNumber',
              },
            ],
          },
        },
      },
    ])
}
