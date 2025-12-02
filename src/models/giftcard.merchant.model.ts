import { model, Schema } from 'mongoose'

const schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowecase: true,
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
  },

  { versionKey: false, timestamps: { createdAt: true } },
)

export const GiftCardMerchantModel = model('giftcard-merchant', schema)
