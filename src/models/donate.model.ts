import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const donateSchema = new Schema(
  {
    liveId: {
      type: Schema.Types.ObjectId,
      ref: 'Live',
      required: true,
      index: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
)

export const DonateModel = model('donates', donateSchema)
export type DonateSchema = InferSchemaType<typeof donateSchema>
export type Donate = HydratedDocumentFromSchema<typeof donateSchema>
