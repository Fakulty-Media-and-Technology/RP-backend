import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const walletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      unique: true,
    },

    NGNBalance: {
      type: Number,
      default: 0,
    },

    USDBalance: {
      type: Number,
      default: 0,
    },

    GMDBalance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

export const WalletModel = model('wallets', walletSchema)
export type WalletSchema = InferSchemaType<typeof walletSchema>
export type WalletDocument = HydratedDocumentFromSchema<typeof walletSchema>
