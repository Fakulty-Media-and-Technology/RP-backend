import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'
import env from '../env'

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
    userId: {
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

    fullName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['success', 'pending', 'failed', 'reversed', 'abandoned'],
      default: env.IS_PROD ? 'pending' : 'success',
      index: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    useCase: {
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
export type PaymentDocument = HydratedDocumentFromSchema<typeof paymentSchema>
