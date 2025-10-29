import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    content: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    contentType: {
      type: String,
      enum: ['vod', 'episode', 'live'],
      required: true,
    },
  },
  { timestamps: { updatedAt: true } },
)

schema.index({ user: 1, content: 1, contentType: 1 }, { unique: true })
export const LikeModel = model('likes', schema)
