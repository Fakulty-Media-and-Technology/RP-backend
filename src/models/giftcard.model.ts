import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const giftcardVideosSchema = new Schema(
  {
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    serial_number: {
      type: Number,
      unique: true,
      default: 0,
    },

    amount: {
      type: Number,
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

export const GiftCardModel = model('Giftcard', giftcardVideosSchema)
export type GiftCardSchema = InferSchemaType<typeof giftcardVideosSchema>
export type GiftCard = HydratedDocumentFromSchema<typeof giftcardVideosSchema>
