import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const walletSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

export const WalletModel = model('Wallet', walletSchema)
export type WalletSchema = InferSchemaType<typeof walletSchema>
export type Wallet = HydratedDocumentFromSchema<typeof walletSchema>
