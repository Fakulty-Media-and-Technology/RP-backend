import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
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

    portraitPhoto: {
      type: Schema.Types.ObjectId,
      ref: 'poster_images',
      required: true,
    },

    landscapePhoto: {
      type: Schema.Types.ObjectId,
      ref: 'poster_images',
      required: true,
    },

    peviewTrailer: {
      type: Schema.Types.ObjectId,
      ref: 'trailers',
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

    releaseDate: {
      type: Date,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

export const UpcomingModel = model('upcomings', schema)
export type UpcomingSchema = InferSchemaType<typeof schema>
export type Upcoming = HydratedDocumentFromSchema<typeof schema>
