import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { validCurrencies } from '../utils/currency'

const voteinfoSchema = new Schema(
  {
    liveId: {
      type: Schema.Types.ObjectId,
      ref: 'Live',
      required: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      enum: validCurrencies,
      reuired: true,
    },

    status: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  },
)

export const VoteInfoModel = model('voteinfos', voteinfoSchema)
export type VoteInfoSchema = InferSchemaType<typeof voteinfoSchema>
export type VoteInfo = HydratedDocumentFromSchema<typeof voteinfoSchema>
