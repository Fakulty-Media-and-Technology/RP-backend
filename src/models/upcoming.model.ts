import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'
import { previewPhotoSchema } from './commonSchema'

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true
    },

    type: {
      type: String,
      enum: ['movie', 'series', 'music video', 'documentary', 'skit'],
      required: true,
    },

    details: {
      type: String,
      required: true,
    },

    reminder: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'users',
        },
      ],
    },

    release_date: {
      type: Date,
      required: true,
    },

    portrait_photo: {
      type: previewPhotoSchema,
      required: true,
    },

    landscape_photo: {
      type: previewPhotoSchema,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    trailer_id: {
      type: Schema.Types.ObjectId,
      ref: 'trailers',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const UpcomingModel = model('upcomings', schema)
export type UpcomingSchema = InferSchemaType<typeof schema>
export type Upcoming = HydratedDocumentFromSchema<typeof schema>
