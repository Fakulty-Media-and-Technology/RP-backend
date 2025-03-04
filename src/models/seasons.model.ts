import { HydratedDocumentFromSchema, InferSchemaType, Schema, model } from 'mongoose'

const schema = new Schema({
  admin: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },

  video: {
    type: Schema.Types.ObjectId,
    ref: 'videos',
    required: true,
  },

  serial_number: {
    type: Number,
    required: true,
  },

  trailer: {
    type: Schema.Types.ObjectId,
    ref: 'trailers',
    default: null,
  },

  description: {
    type: String,
    default: null,
  },

  trailerLink: {
    type: String,
    default: null,
  },

  landscapePhoto: {
    type: Schema.Types.ObjectId,
    ref: 'poster_images',
    default: null,
    // required: true,
  },

  portraitPhoto: {
    type: Schema.Types.ObjectId,
    ref: 'poster_images',
    default: null,
    // required: true,
  },

  // add other fields here as needed
})

schema.index({ video: 1, serial_number: 1 }, { unique: true })

export const SeasonModel = model('seasons', schema)
export type SeasonSchema = InferSchemaType<typeof schema>
export type Season = HydratedDocumentFromSchema<typeof schema>
