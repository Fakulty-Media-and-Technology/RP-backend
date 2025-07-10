import { HydratedDocumentFromSchema, InferSchemaType, model, Schema } from 'mongoose'

const contentSchema = new Schema(
  {
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    contentType: {
      type: String,
      enum: ['vod', 'live'],
      required: true,
    },
  },
  { timestamps: false, _id: false, versionKey: false },
)

const schema = new Schema(
  {
    user: {
      type: String,
      unique: true,
    },

    contents: {
      type: [contentSchema],
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
)

export const RecentSearchModel = model('recent_searches', schema)
export type ContentSchema = InferSchemaType<typeof contentSchema>
export type RecentSearchDocument = HydratedDocumentFromSchema<typeof schema>
