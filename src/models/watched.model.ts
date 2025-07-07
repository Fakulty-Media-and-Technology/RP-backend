import { InferSchemaType, model, Schema } from 'mongoose'

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },

    parentType: {
      type: String,
      enum: ['episode', 'vod'],
      required: true,
    },

    parentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
)

schema.index({ userId: 1, parentType: 1, parentId: 1 }, { unique: true })
schema.index({ updatedAt: 1 })

export const WatchedModel = model('watched', schema)
export type WatchedSchema = InferSchemaType<typeof schema>
