import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const payoutSchema = new Schema(
  {
    client_id: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    processed_by: {
      type: [Schema.Types.ObjectId],
      ref: 'users',
    },
    amount: {
      type: Number,
      required: true,
    },
    charges: {
      type: Number,
    },
    account_number: {
      type: String,
      required: true,
    },
    account_name: {
      type: String,
      required: true,
    },
    bank_name: {
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
export type Payout = HydratedDocumentFromSchema<typeof payoutSchema>
