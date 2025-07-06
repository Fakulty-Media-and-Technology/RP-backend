import env from '../../env'
import { GiftCardModel } from '../../models/giftcard.model'
import { WalletRepo } from '../../repositories/WalletRepo'
import { LoggedInUser } from '../../types'
import { ValidCurrency } from '../../utils/currency'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { OperationalError } from '../../utils/OperationalError'
import { ExpressRequestQuery, QueryParamsFeatures } from '../../utils/QueryParamsFeatures'
import { genRandUniqId } from '../../utils/strGen'

interface CreateGiftCardInput {
  currentAdmin: LoggedInUser
  amount: number
  currency: ValidCurrency
}

interface RedeemGiftCardInput {
  user: LoggedInUser
  giftCode: string
}

export class GiftCardService {
  protected static _getUniqueGiftCode = async (triesCount = 1): Promise<string> => {
    if (triesCount >= 5) {
      throw new OperationalError('Cannot generate giftCode, please try again', 500)
    }

    const uniq_code = genRandUniqId(11 + triesCount).toUpperCase()

    const giftCard = await GiftCardModel.findOne({
      code: uniq_code,
    })

    return giftCard == null ? uniq_code : await this._getUniqueGiftCode(++triesCount)
  }

  static create = async ({ currentAdmin, amount, currency }: CreateGiftCardInput) => {
    const [lastGiftCard] = await GiftCardModel.find({}).sort({ serialNumber: -1 }).limit(1)

    const lastSerialNumber = lastGiftCard?.serialNumber ?? 0

    const newGiftCard = await GiftCardModel.create({
      admin_id: currentAdmin._id,
      serialNumber: lastSerialNumber + 1,
      code: await this._getUniqueGiftCode(),
      currency,
      amount,
    })

    return newGiftCard
  }

  static activate = async (code: string, adminAuthToken: string) => {
    if (adminAuthToken !== env.GIFT_CARD_AUTHORIZATION_TOKEN) {
      throw new OperationalError('Invalid auth code', 403)
    }

    const card = await GiftCardModel.findOne({ code })

    if (!card) {
      throw new OperationalError('card not found', 404)
    }

    if (card.status === 'used') {
      throw new OperationalError('card is used', 403)
    }

    if (card.status === 'active') {
      throw new OperationalError('card is already active', 403)
    }

    card.status = 'active'
    await card.save()
  }

  static fetch = async (query: ExpressRequestQuery) => {
    const { skip, limit } = QueryParamsFeatures.paginagteParams(query)

    const cards = await GiftCardModel.aggregate([
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $addFields: {
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
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ])

    return cards
  }

  private static _redeemGiftCardSession = async (
    { user, giftCode }: RedeemGiftCardInput,
    session: MaybeSession,
  ) => {
    const card = await GiftCardModel.findOne({
      code: giftCode,
    })

    if (!card) {
      throw new OperationalError('invalid gift code entered', 404)
    }

    if (card.status == 'used') {
      throw new OperationalError('Oops, voucher has been used', 403)
    }

    if (card.status == 'inactive') {
      throw new OperationalError('Voucher can not be used', 403)
    }

    await WalletRepo.updateBalance({
      currency: card.currency,
      topUpAmount: card.amount,
      userId: user._id,
      session,
    })

    card.status = 'used'
    await card.save({ session })
  }

  static redeem = async (input: RedeemGiftCardInput) =>
    await withMongoDBSession(this._redeemGiftCardSession, input)
}
