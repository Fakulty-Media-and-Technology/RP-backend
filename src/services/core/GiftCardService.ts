import { ClientSession } from 'mongoose'
import env from '../../env'
import { GiftCardMerchantModel } from '../../models/giftcard.merchant.model'
import { GiftCard, GiftCardModel } from '../../models/giftcard.model'
import { WalletRepo } from '../../repositories/WalletRepo'
import { LoggedInUser } from '../../types'
import { validCurrencies, ValidCurrency } from '../../utils/currency'
import { MaybeSession, withMongoDBSession } from '../../utils/mongoDbSessionRunner'
import { OperationalError } from '../../utils/OperationalError'
import {
  ExpressRequestQuery,
  guranteeNumericResult,
  QueryParamsFeatures,
} from '../../utils/QueryParamsFeatures'
import { genRandUniqId } from '../../utils/strGen'
import { Password } from '../../utils/Password'

interface CreateGiftCardInput {
  currentAdmin: LoggedInUser
  amount: number
  currency: ValidCurrency
}

interface RedeemGiftCardInput {
  user: LoggedInUser
  giftCode: string
}

interface GetMerchanttCardsInput {
  query: ExpressRequestQuery
  merchantEmail: string
  merchantPassword: string
  currency: string
}

export class GiftCardService {
  protected static _getUniqueGiftCode = async (triesCount = 0): Promise<string> => {
    if (triesCount === 6) {
      throw new OperationalError('Cannot generate giftCode, please try again', 500)
    }

    const uniq_code = genRandUniqId(12 + triesCount).toUpperCase()

    const giftCard = await GiftCardModel.findOne({
      code: uniq_code,
    })

    return giftCard == null ? uniq_code : await this._getUniqueGiftCode(++triesCount)
  }

  protected static _generateMerchateGiftCodes = async (quantity: number) => {
    // TODO: Use Promise.allSettled
    const codes = await Promise.all(new Array(quantity).fill(0).map(this._getUniqueGiftCode))

    return codes
  }

  static createMerchant = async (email: string, password: string) => {
    email = email.toLocaleLowerCase()

    const merchant = await GiftCardMerchantModel.findOne({ email }).select('email')

    if (merchant) {
      throw new OperationalError('Already exists', 400)
    }

    await GiftCardMerchantModel.create({
      email,
      password: await Password.encrypt(password.trim()),
    })
  }

  protected static _getMerchant = async (email: string, password: string) => {
    const merchantDocument = await GiftCardMerchantModel.findOne({
      email: email.toLocaleLowerCase(),
    })

    if (merchantDocument == null) {
      throw new OperationalError('Invalid email address', 401)
    }

    const isSamePassword = await Password.compare(password, merchantDocument.password)

    if (!isSamePassword) {
      throw new OperationalError('Invalid Password', 401)
    }

    return merchantDocument
  }

  protected static _trimMerchatCards = (cards: GiftCard[]) =>
    cards.map(card => ({
      serialNumber: card.serialNumber,
      code: card.code,
      amount: card.amount,
      currency: card.currency,
    }))

  static _getMerchantCardsSession = async (
    { merchantEmail, currency, query, merchantPassword }: GetMerchanttCardsInput,
    session?: ClientSession,
  ) => {
    if (!validCurrencies.includes(currency as any)) {
      throw new OperationalError(`Valid currencies are ${validCurrencies.join(' || ')}`, 400)
    }

    const merchantDocument = await this._getMerchant(merchantEmail, merchantPassword)
    const amount = guranteeNumericResult(query.amount, 1)
    const quantity = guranteeNumericResult(query.quantity, 1)
    const maxBatchSize = 5

    if (quantity > maxBatchSize) {
      throw new OperationalError(`Maximum of ${maxBatchSize} cards are allowed per batch`, 400)
    }

    if ((currency === 'NGN' || currency === 'GMD') && amount > 100_000) {
      throw new OperationalError('Maximum amount is 100,000', 400)
    }

    if (currency === 'USD' && amount > 1000) {
      throw new OperationalError('Maximum amount is 1000', 400)
    }

    const [codesSettled, recentSerialNumberSettled] = await Promise.allSettled([
      this._generateMerchateGiftCodes(quantity),
      GiftCardModel.find({}).sort({ serialNumber: -1 }).limit(1),
    ])

    if (codesSettled.status === 'rejected') {
      throw new OperationalError('Error generating codes. Please try again', 500)
    }
    if (recentSerialNumberSettled.status === 'rejected') {
      throw new OperationalError('Error generating Serial Number. Please try again', 500)
    }

    const codes = codesSettled.value
    const lastSerialNumber = recentSerialNumberSettled.value[0]?.serialNumber ?? 0

    const cards = await GiftCardModel.insertMany(
      codes.map((code, i) => ({
        admin_id: merchantDocument._id,
        serialNumber: lastSerialNumber + i + 1,
        amount,
        currency,
        code,
        creatorMode: 'MERCHANT',
        status: 'active',
      })),
      { session },
    )

    return this._trimMerchatCards(cards)
  }

  static getMerchantCards = async (params: GetMerchanttCardsInput) =>
    await withMongoDBSession(this._getMerchantCardsSession, params)

  static setMerchactCardIsUsed = async (
    code: string,
    merchantEmail: string,
    merchantPassword: string,
  ) => {
    const merchantDocument = await this._getMerchant(merchantEmail, merchantPassword)
    const cardDocument = await GiftCardModel.findOne({
      code,
    })

    if (
      cardDocument == null ||
      cardDocument.admin_id.toString() !== merchantDocument._id.toString()
    ) {
      throw new OperationalError('Invalid Code', 404)
    }

    if (cardDocument.status === 'used') {
      throw new OperationalError('Gift card is used', 403)
    }

    cardDocument.status = 'used'
    await cardDocument.save()
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

  static deleteById = async (id: string) => {
    const dCard = await GiftCardModel.findByIdAndDelete(id)

    if (dCard == null) {
      throw new OperationalError('invalid gift card Id', 404)
    }
  }
}
