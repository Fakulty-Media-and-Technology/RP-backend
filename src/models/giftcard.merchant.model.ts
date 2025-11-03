import { model, Schema } from 'mongoose'

const schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { versionKey: false, timestamps: { createdAt: true } },
)

export const GiftCardMerchantModel = model('giftcard-merchant', schema)
