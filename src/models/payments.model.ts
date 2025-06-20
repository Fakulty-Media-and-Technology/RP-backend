import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'

const paymentUseCases = [
  'subscription',
  'topup',
  'vote',
  'donate',
  'live schedule',
  'live schedule ext',
] as const

export type PaymentUseCase = (typeof paymentUseCases)[number]

const paymentSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    currency: {
      type: String,
      enum: validCurrencies,
      required: true,
      index: true,
    },

    full_name: {
      type: String,
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    // query by reference in webhooks
    reference: {
      type: String,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      required: true,
      index: true,
    },

    is_used: {
      type: Boolean,
      default: false,
    },

    use_case: {
      type: String,
      enum: paymentUseCases,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

export const PaymentModel = model('payments', paymentSchema)
export type PaymentSchema = InferSchemaType<typeof paymentSchema>
export type Payment = HydratedDocumentFromSchema<typeof paymentSchema>
