import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const paymentSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    is_used: {
      type: Boolean,
      default: false,
    },
    use_case: {
      type: String,
      enum: ['subscription', 'topup', 'vote', 'donate', 'live schedule', 'live schedule ext'],
    },
  },
  {
    timestamps: true,
  },
)

export const PaymentModel = model('payments', paymentSchema)
export type PaymentSchema = InferSchemaType<typeof paymentSchema>
export type Payment = HydratedDocumentFromSchema<typeof paymentSchema>
