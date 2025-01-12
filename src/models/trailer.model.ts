import { HydratedDocumentFromSchema, InferSchemaType,  Schema, model } from 'mongoose'

const trailerSchema = new Schema(
  {
    video_id: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      // required: true
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

    video_upload: {
      type: Schema.Types.ObjectId,
      ref: 'video_uploads',
    },
  },
  {
    timestamps: true,
  },
)

export const TrailerModel = model('trailers', trailerSchema)
export type TrailerSchema = InferSchemaType<typeof trailerSchema>
export type Trailer = HydratedDocumentFromSchema<typeof trailerSchema>
