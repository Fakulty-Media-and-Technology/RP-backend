import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const upcomingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['movie', 'series', 'music video', 'ducumentary', 'skit'],
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    reminder: {
      type: [String], //user ids that subscribe
    },
    release_date: {
      type: Date,
      required: true,
    },
    portrait_photo: {
      type: Object,
      required: true,
    },
    landscape_photo: {
      type: Object,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    trailer_id: {
      type: Schema.Types.ObjectId,
      ref: 'Trailer',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

export const UpcomingModel = model('Upcoming', upcomingSchema)
export type UpcomingSchema = InferSchemaType<typeof upcomingSchema>
export type Upcoming = HydratedDocumentFromSchema<typeof upcomingSchema>
