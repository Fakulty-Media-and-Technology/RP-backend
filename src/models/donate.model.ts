import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const donateSchema = new Schema(
  {
    live_id: {
      type: Schema.Types.ObjectId,
      ref: 'Live',
      required: true,
    },
    customer_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    payment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const DonateModel = model('donates', donateSchema)
export type DonateSchema = InferSchemaType<typeof donateSchema>
export type Donate = HydratedDocumentFromSchema<typeof donateSchema>
