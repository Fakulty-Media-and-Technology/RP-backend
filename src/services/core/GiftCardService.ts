import { GiftCardModel } from "../../models/giftcard.model"
import { LoggedInUser } from "../../types"
import { OperationalError } from "../../utils/OperationalError"
import { uniqueRef } from "../unique-ref"

export class GiftCardService {
    static createGiftCard = async (currentAdmin: LoggedInUser, amount: number) => {
      const uniq_code = uniqueRef()
  
      // TODO: this can be optimized
      const checkExist = await GiftCardModel.findOne({
        code: uniq_code,
      })
  
      if (checkExist) {
        throw new OperationalError('something went wrong, please try again', 400)
      }
  
      const giftCards = await GiftCardModel.find({}).sort({
        createdAt: -1,
        serial_number: -1,
      })
  
      const serialN = giftCards.length > 0 ? giftCards[0].serial_number : 0
  
      const newGiftCard = await GiftCardModel.create({
        admin_id: currentAdmin._id,
        serial_number: serialN + 1,
        code: uniq_code,
        amount,
      })
  
      return newGiftCard
    }
  
    static fetchGiftCards = async (page: number, limit: number) => {
      const cards = await GiftCardModel.aggregate([
        {
          $match: {
            $expr: {
              $ne: ['$_id', null],
            },
          },
        },
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
          $skip: page - 1 * limit,
        },
        {
          $limit: limit,
        },
      ])
  
      return cards
    }
  }