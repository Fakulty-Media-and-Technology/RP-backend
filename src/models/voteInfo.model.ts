import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const voteinfoSchema = new Schema(
  {
    live_id: {
      type: Schema.Types.ObjectId,
      ref: 'Live',
      required: true,
    },
    client_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: true,
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
