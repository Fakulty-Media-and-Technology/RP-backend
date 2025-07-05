import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'

const payoutSchema = new Schema(
  {
    client_id: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },

    processedBy: {
      type: [Schema.Types.ObjectId],
      ref: 'users',
    },

    amount: {
      type: Number,
      required: true,
    },

    charges: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      enum: validCurrencies,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
    },

    accountName: {
      type: String,
      required: true,
    },

    bankName: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'reversed', 'rejected', 'completed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  },
)

export const PayoutModel = model('payouts', payoutSchema)
export type PayoutSchema = InferSchemaType<typeof payoutSchema>
export type PayoutDocument = HydratedDocumentFromSchema<typeof payoutSchema>
