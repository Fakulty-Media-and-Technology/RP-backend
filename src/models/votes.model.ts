import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const voteSchema = new Schema(
  {
    live_id: {
      type: Schema.Types.ObjectId,
      ref: 'Live',
      required: true,
    },
    voter_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contestant_id: {
      type: Schema.Types.ObjectId,
      ref: 'Contestant',
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

export const VoteModel = model('Vote', voteSchema)
export type VoteSchema = InferSchemaType<typeof voteSchema>
export type Vote = HydratedDocumentFromSchema<typeof voteSchema>
