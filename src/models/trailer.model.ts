import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const trailerSchema = new Schema(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      // unique: true,
    },
    video_title: {
      type: String,
      // required: true,
    },
    details: {
      type: String,
      // required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
      unique: true
    },
  },
  {
    timestamps: true,
  },
)

export const TrailerModel = model('trailers', trailerSchema)
export type TrailerSchema = InferSchemaType<typeof trailerSchema>
export type Trailer = HydratedDocumentFromSchema<typeof trailerSchema>
