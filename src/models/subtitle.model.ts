import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const subtitleSchema = new Schema(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    parentType: {
      type: String,
      enum: ['vod', 'episode', 'series'],
      required: true,
    },

    key: {
      type: String,
      unique: true,
      required: [true, 'A subtitle must have a key'],
    },

    bucket: {
      type: String,
      required: [true, 'A subtitle must have a bucket'],
    },

    language: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, 'A subtitle must have a language'],
    },
  },
  {
    timestamps: true,
  },
)

subtitleSchema.index({ video_id: 1, language: 1 }, { unique: true })

export const SubtitleModel = model('sub_titles', subtitleSchema)
export type SubtitleSchema = InferSchemaType<typeof subtitleSchema>
export type Subtitle = HydratedDocumentFromSchema<typeof subtitleSchema>
