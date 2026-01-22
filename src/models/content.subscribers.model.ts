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
      type: Schema,
      enum: ['VOD', 'LIVE'],
      required: true,
    },

    at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false, versionKey: false },
)

schema.index({ user: 1, content: 1 }, { name: '_uniqueSubcription' })

export const ContentSubscribersModel = model('content-subscribers', schema)
