import { GiftCardModel } from '../../models/giftcard.model'
import { LoggedInUser } from '../../types'
import { OperationalError } from '../../utils/OperationalError'
import { skip } from '../../utils/QueryParamsFeatures'
import { genRandUniqId } from '../../utils/strGen'

const getUniqueGiftCode = async (triesCount = 1) => {
  if (triesCount >= 5) {
    throw new OperationalError('Cannot generate giftCode, please try again', 500)
  }

  const uniq_code = genRandUniqId(12).toUpperCase()

  // TODO: this can be optimized
  const giftCard = await GiftCardModel.findOne({
    code: uniq_code,
  })

  if (giftCard) {
    return await getUniqueGiftCode(++triesCount)
  }

  return uniq_code
}

export class GiftCardService {
  static createGiftCard = async (currentAdmin: LoggedInUser, amount: number) => {
    const giftCards = await GiftCardModel.find({}).sort({
      createdAt: -1,
      serial_number: -1,
    })

    const serialN = giftCards.length > 0 ? giftCards[0].serial_number : 0

    const newGiftCard = await GiftCardModel.create({
      admin_id: currentAdmin._id,
      serial_number: serialN + 1,
      code: await getUniqueGiftCode(),
      amount,
    })

    return newGiftCard
  }

  static fetchGiftCards = async (page: number, limit: number) => {
    const cards = await GiftCardModel.aggregate([
      {
        $sort: {
          createdAt: -1,
          serial_number: -1,
        },
      },
      {
        $addFields: {
          serial_number: {
            $concat: [
              'SN',
              {
                $toString: '$serial_number',
              },
            ],
          },
        },
      },
      {
        $skip: skip(page, limit),
      },
      {
        $limit: limit,
      },
    ])

    return cards
  }
}
