import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const subtitleSchema = new Schema(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },

    parentType: {
      type: String,
      enum: ['vod', 'episode'],
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

    is_series: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const SubtitleModel = model('sub_titles', subtitleSchema)
export type SubtitleSchema = InferSchemaType<typeof subtitleSchema>
export type Subtitle = HydratedDocumentFromSchema<typeof subtitleSchema>
