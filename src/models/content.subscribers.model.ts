import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

export const VOD_CONTENT_SUB = 'VOD'
export const LIVE_CONTENT_SUB = 'LIVE'

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
      enum: [VOD_CONTENT_SUB, LIVE_CONTENT_SUB],
      required: true,
    },

    at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false, versionKey: false },
)

schema.index({ user: 1, content: 1, contentType: 1 }, { name: '_uniqueSubcription', unique: true })

export const ContentSubscribersModel = model('content-subscribers', schema)
export type ContentSubscribersSchema = InferSchemaType<typeof schema>
export type ContentSubscribersDocuments = HydratedDocumentFromSchema<typeof schema>
