import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const subtitleSchema = new Schema(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
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
