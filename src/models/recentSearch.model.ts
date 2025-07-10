import { model, Schema } from 'mongoose'

const contentsSchema = new Schema(
  {
    contentId: {
      type: String,
      required: true,
    },

    contentType: {
      type: String,
      enum: ['vod', 'live'],
    },
  },
  { timestamps: false, index: false, versionKey: false },
)

const schema = new Schema(
  {
    user: {
      type: String,
      unique: true,
    },

    contents: {
      type: [contentsSchema],
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
)

export const RecentSearchModel = model('recent_searches', schema)
