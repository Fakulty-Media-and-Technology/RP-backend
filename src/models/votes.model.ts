import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const voteSchema = new Schema(
  {
    liveId: {
      type: Schema.Types.ObjectId,
      ref: 'Live',
      required: true,
      index: true,
    },

    voterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    contestantId: {
      type: Schema.Types.ObjectId,
      ref: 'Contestant',
      required: true,
      index: true,
    },

    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },

    isDone: {
      type: Boolean,
      default: false,
    },

    quantity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const VoteModel = model('votes', voteSchema)
export type VoteSchema = InferSchemaType<typeof voteSchema>
export type Vote = HydratedDocumentFromSchema<typeof voteSchema>
