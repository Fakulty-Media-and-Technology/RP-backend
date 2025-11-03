import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'

const giftcardVideosSchema = new Schema(
  {
    admin_id: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
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

    creatorMode: {
      type: String,
      enum: ['RP', 'MERCHANT'],
      default: 'RP',
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'used'],
      default: 'inactive',
    },
  },

  {
    timestamps: true,
    versionKey: false,
  },
)

export const GiftCardModel = model('giftcards', giftcardVideosSchema)
export type GiftCardSchema = InferSchemaType<typeof giftcardVideosSchema>
export type GiftCard = HydratedDocumentFromSchema<typeof giftcardVideosSchema>
