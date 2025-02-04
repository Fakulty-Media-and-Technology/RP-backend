import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const trailerSchema = new Schema(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: [true, 'A trailer must belong to a video'],
    },

    video_upload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
      required: [true, 'A trailer must have a video upload'],
    },

    parentType: {
      type: String,
      enum: ['vod', 'episode'],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export const TrailerModel = model('trailers', trailerSchema)
export type TrailerSchema = InferSchemaType<typeof trailerSchema>
export type Trailer = HydratedDocumentFromSchema<typeof trailerSchema>
