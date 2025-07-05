import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'

const giftcardVideosSchema = new Schema(
  {
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    serialNumber: {
      type: Number,
      unique: true,
      default: 0,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      enum: validCurrencies,
      required: true,
    },

    code: {
      type: String,
      required: true,
      unique: true,
    },

    used: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  },
)

export const GiftCardModel = model('giftcards', giftcardVideosSchema)
export type GiftCardSchema = InferSchemaType<typeof giftcardVideosSchema>
export type GiftCard = HydratedDocumentFromSchema<typeof giftcardVideosSchema>
