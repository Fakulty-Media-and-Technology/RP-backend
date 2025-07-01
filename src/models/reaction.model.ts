import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    commentId: {
      type: Schema.Types.ObjectId,
      ref: 'comments',
      required: true,
      index: true,
    },

    reaction: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
)

schema.index({ userId: 1, commentId: 1 }, { unique: true })

export const ReactionModel = model('reactions', schema)
