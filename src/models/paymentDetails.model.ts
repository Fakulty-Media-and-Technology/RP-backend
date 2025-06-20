import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const paymentDetailsSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
  },
  {
    timestamps: true,
  },
)

export const PaymentDetailModel = model('payment_details', paymentDetailsSchema)
export type PaymentDetailSchema = InferSchemaType<typeof paymentDetailsSchema>
export type PaymentDetail = HydratedDocumentFromSchema<typeof paymentDetailsSchema>
