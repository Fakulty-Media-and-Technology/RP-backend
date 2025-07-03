import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const paymentDetailsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'payments',
      required: true,
      index: true,
    },

    authorization_code: {
      type: String,
    },

    last4: {
      type: String,
    },

    exp_month: {
      type: String,
    },

    exp_year: {
      type: String,
    },

    brand: {
      type: String,
    },

    reusable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

export const PaymentDetailModel = model('payment_details', paymentDetailsSchema)
export type PaymentDetailSchema = InferSchemaType<typeof paymentDetailsSchema>
export type PaymentDetail = HydratedDocumentFromSchema<typeof paymentDetailsSchema>
