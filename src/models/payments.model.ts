import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'

const paymentUseCases = [
  'subscription',
  'topup',
  'vote',
  'donate',
  'live schedule',
  'live schedule ext',
  'live-watch-exclusive',
  'video-watch-premium',
  'video-watch-exclusive',
] as const

export type PaymentUseCase = (typeof paymentUseCases)[number]

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    liveId: {
      type: Schema.Types.ObjectId,
      ref: 'lives',
      sparse: true,
    },

    videoId: {
      type: Schema.Types.ObjectId,
      ref: 'videos',
      sparse: true
    },

    currency: {
      type: String,
      enum: validCurrencies,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
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
      index: true,
    },

    method: {
      type: String,
      enum: ['paystack', 'wallet'],
      required: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    useCase: {
      type: String,
      enum: paymentUseCases,
      index: true,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

schema.index({ userId: 1, currency: 1, useCase: 1 })

export const PaymentModel = model('payments', schema)
export type PaymentSchema = InferSchemaType<typeof schema>
export type PaymentDocument = HydratedDocumentFromSchema<typeof schema>
